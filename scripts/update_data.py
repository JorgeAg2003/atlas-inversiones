#!/usr/bin/env python3
"""Daily best-effort public market snapshot for a static dashboard.

No trading, emails, API keys or user information. Always date-stamps market data
and preserves the last known value on provider failure. Yahoo via yfinance is an
unofficial convenience source; validate key figures against company filings.
"""
from __future__ import annotations

import json
import logging
import math
import os
import re
from datetime import datetime, timezone, timedelta
from pathlib import Path
from urllib.parse import quote

import feedparser
import numpy as np
import pandas as pd
import requests
import yfinance as yf

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "market.json"
MAIN = ["TSM", "MSFT", "V", "COST"]
WATCH = ["ETN", "ASML", "CRH", "SNOW", "AMX"]
SYMBOLS = MAIN + WATCH + ["SPY"]
RSS_TERMS = {
    "TSM": "TSMC semiconductor earnings capex AI",
    "MSFT": "Microsoft Azure earnings AI cloud",
    "V": "Visa payments earnings interchange regulation",
    "COST": "Costco membership sales earnings",
    "ETN": "Eaton electrical data centers earnings",
    "ASML": "ASML semiconductor equipment earnings",
    "CRH": "CRH building materials earnings",
    "SNOW": "Snowflake data platform earnings",
    "AMX": "America Movil telecom earnings",
}
POSITIVE = re.compile(r"\b(beat|beats|record|growth|surge|raises|raised|upgrade|expands|expansion|win|wins|strong|rise|rises|gains|profit jumps|crece|récord|sube|expande|aumenta)\b", re.I)
NEGATIVE = re.compile(r"\b(miss|misses|falls|fall|cut|cuts|downgrade|lawsuit|fine|fined|probe|investigation|slump|drop|drops|slows|slowing|warning|risk|decline|declines|cae|demanda|multa|recorta|investiga)\b", re.I)
LOG = logging.getLogger("atlas_update")


def finite(value):
    try:
        if value is None or isinstance(value, (list, dict)):
            return None
        v = float(value)
        return v if math.isfinite(v) else None
    except (ValueError, TypeError, OverflowError):
        return None


def info_num(d: dict, key: str):
    return finite(d.get(key))


def change(s: pd.Series, days: int):
    if len(s) <= days:
        return None
    a, b = finite(s.iloc[-days-1]), finite(s.iloc[-1])
    return round((b / a - 1) * 100, 3) if a and b else None


def get_ticker_info(stock):
    try:
        return stock.get_info() or {}
    except Exception as exc:
        LOG.warning("Info not available: %s", exc)
        return {}


def get_history(stock):
    try:
        df = stock.history(period="5y", interval="1d", auto_adjust=True, actions=False, timeout=20)
        if df is not None and len(df) and "Close" in df:
            s = df["Close"].dropna().astype(float)
            s.index = pd.to_datetime(s.index, utc=True).tz_convert(None).normalize()
            return s[~s.index.duplicated(keep="last")].sort_index()
    except Exception as exc:
        LOG.warning("History not available: %s", exc)
    return pd.Series(dtype=float)


def resample_for_chart(s: pd.Series):
    if s.empty:
        return []
    # 5 years on ~weekly observations; keep the last daily value for accuracy.
    weekly = s.resample("W-FRI").last().dropna()
    if weekly.empty or weekly.index[-1] != s.index[-1]:
        weekly.loc[s.index[-1]] = s.iloc[-1]
    return [[d.strftime("%Y-%m-%d"), round(float(v), 5)] for d, v in weekly.sort_index().items() if finite(v) is not None]


def metrics(info: dict, ts: str):
    fincur = str(info.get("financialCurrency") or "")
    quote_currency = str(info.get("currency") or "")
    fcf, market_cap = info_num(info, "freeCashflow"), info_num(info, "marketCap")
    # Critical: for ADRs a local-currency FCF cannot be divided by USD market cap.
    yield_fcf = fcf / market_cap if (fcf is not None and market_cap is not None and market_cap > 0 and fincur and fincur == quote_currency) else None
    return {
        "trailing_pe": info_num(info, "trailingPE"),
        "forward_pe": info_num(info, "forwardPE"),
        "operating_margin": info_num(info, "operatingMargins"),
        "gross_margin": info_num(info, "grossMargins"),
        "profit_margin": info_num(info, "profitMargins"),
        "revenue_growth": info_num(info, "revenueGrowth"),
        "earnings_growth": info_num(info, "earningsGrowth"),
        "roe": info_num(info, "returnOnEquity"),
        "roa": info_num(info, "returnOnAssets"),
        "free_cashflow": fcf,
        "operating_cashflow": info_num(info, "operatingCashflow"),
        "market_cap": market_cap,
        "fcf_yield": yield_fcf,
        "total_debt": info_num(info, "totalDebt"),
        "total_cash": info_num(info, "totalCash"),
        "debt_to_equity_pct": info_num(info, "debtToEquity"),
        "financial_currency": fincur or None,
        "quote_currency": quote_currency or None,
        "provider": "Yahoo Finance / yfinance (no auditado)",
        "as_of": ts,
    }


def fetch_stock(ticker: str, last: dict, now: str):
    old = last.get("symbols", {}).get(ticker, {})
    try:
        stock = yf.Ticker(ticker)
        h = get_history(stock)
        info = get_ticker_info(stock)
        if h.empty:
            LOG.warning("%s: no updated historical prices, preserving previous snapshot", ticker)
            return {**old, "refresh_error": "Historial no disponible"}, pd.Series(dtype=float), False
        quote = {
            "price": finite(h.iloc[-1]),
            "price_date": h.index[-1].strftime("%Y-%m-%d"),
            "history": resample_for_chart(h),
            "change_1d": change(h, 1),
            "change_1w": change(h, 5),
            "change_1m": change(h, 21),
            "metrics": metrics(info, now) if info else old.get("metrics", {}),
            "news": old.get("news", []),
            "refresh_error": None,
        }
        return quote, h, True
    except Exception as exc:
        LOG.exception("Failed %s: %s", ticker, exc)
        return {**old, "refresh_error": str(exc)[:110]}, pd.Series(dtype=float), False


def parse_dt(entry):
    dt = entry.get("published_parsed") or entry.get("updated_parsed")
    if dt:
        try:
            import calendar
            return datetime.fromtimestamp(calendar.timegm(dt), tz=timezone.utc).isoformat()
        except Exception:
            pass
    return None


def news_signal(title: str):
    pos, neg = bool(POSITIVE.search(title)), bool(NEGATIVE.search(title))
    return "favorable" if pos and not neg else "adversa" if neg and not pos else "neutral"


def google_news(symbol: str):
    query = quote(RSS_TERMS[symbol] + " when:14d")
    feed_url = "https://news.google.com/rss/search?q=" + query + "&hl=en-US&gl=US&ceid=US:en"
    try:
        resp = requests.get(feed_url, headers={"User-Agent":"AtlasInvestmentMonitor/1.0 (public project; no tracking)"}, timeout=17)
        resp.raise_for_status()
        feed = feedparser.parse(resp.content)
        seen = set()
        result = []
        for e in feed.entries:
            title = str(e.get("title", "")).strip()
            link = str(e.get("link", ""))
            if not title or not link.startswith("https://") or title.lower() in seen:
                continue
            seen.add(title.lower())
            publisher = e.get("source", {}).get("title", "") if isinstance(e.get("source"), dict) else ""
            result.append({"title": title[:280], "link": link, "published": parse_dt(e), "publisher": str(publisher)[:85], "signal": news_signal(title), "classification_note": "Heurística de titulares"})
            if len(result) >= 6:
                break
        return result
    except Exception as exc:
        LOG.warning("News not available for %s: %s", symbol, exc)
        return None


def sample_risk(histories: dict):
    if any(t not in histories or histories[t].empty for t in MAIN) or "MXN=X" not in histories or histories["MXN=X"].empty:
        return None
    closes = pd.concat([histories[t].rename(t) for t in MAIN]+[histories["MXN=X"].rename("USD_MXN")], axis=1)
    closes = closes.ffill(limit=2).dropna()
    if len(closes) < 60:
        return None
    ret = closes.pct_change(fill_method=None).dropna()
    fx = ret["USD_MXN"]
    values = {t: (1 + ret[t]) * (1 + fx) - 1 for t in MAIN}
    df = pd.DataFrame(values).replace([np.inf, -np.inf], np.nan).dropna().tail(756)
    return {"returns_mxn": {t: [round(float(x), 8) for x in df[t].values] for t in MAIN}, "n_days": len(df), "first_date": df.index[0].date().isoformat(), "last_date": df.index[-1].date().isoformat(), "method": "Precios ajustados, rendimientos diarios con conversión USD/MXN"}


def main():
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    now = datetime.now(timezone.utc).isoformat()
    old = {}
    if OUTPUT.exists():
        try:
            old = json.loads(OUTPUT.read_text(encoding="utf-8"))
        except Exception:
            pass
    data = {
        "meta": {"generated_at": now, "quotes_success": False, "status": "partial", "source": "Yahoo Finance / yfinance; Google News RSS", "notice": "Precio de cierre disponible, no necesariamente precio en tiempo real"},
        "symbols": {}, "fx": old.get("fx", {"rate":None,"change_1w":None}), "risk": old.get("risk", {"returns_mxn":{}})
    }
    hist, ok = {}, []
    for t in SYMBOLS + ["MXN=X"]:
        data_tick, history, success = fetch_stock(t, old, now)
        hist[t] = history
        if t == "MXN=X":
            if success:
                data["fx"] = {"rate":data_tick["price"], "change_1w":data_tick["change_1w"], "price_date":data_tick["price_date"]}
        else:
            data["symbols"][t] = data_tick
        if t in MAIN and success:
            ok.append(t)
    for t in MAIN + WATCH:
        news = google_news(t)
        if news is not None:
            data["symbols"].setdefault(t, {})["news"] = news
    risk = sample_risk(hist)
    if risk:
        data["risk"] = risk
    data["meta"]["quotes_success"] = len(ok) == len(MAIN)
    data["meta"]["status"] = "ok" if len(ok) == len(MAIN) else ("partial" if ok else "no_new_quotes")
    data["meta"]["successful_main_tickers"] = ok
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    tmp = OUTPUT.with_suffix(".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False), encoding="utf-8")
    tmp.replace(OUTPUT)
    LOG.info("Updated %s — successful primary tickers: %s", OUTPUT, ", ".join(ok) if ok else "none")
    # Do not silently claim the refresh completed if price quotes were unavailable.
    if not ok:
        raise SystemExit("No current quotes fetched. Last saved data marked partial; workflow should report failure.")


if __name__ == "__main__":
    main()
