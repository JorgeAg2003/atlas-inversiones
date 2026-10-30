'use strict';
(function(){
const terms={
trailing_pe:['P/U últimos 12 meses','Precio dividido entre utilidad por acción de los últimos 12 meses.','Un número menor puede indicar un precio más razonable, pero también un negocio con problemas.','Un P/U de 25× significa que pagas 25 dólares por cada dólar de utilidad anual reciente.'],
forward_pe:['P/U forward','Precio actual dividido entre la utilidad por acción esperada para los próximos 12 meses.','Depende de pronósticos: si las utilidades decepcionan, el múltiplo real será mayor.','20× forward significa 20 dólares de precio por cada dólar de utilidad futura esperada.'],
operating_margin:['Margen operativo','De cada 100 de ventas, cuánto queda antes de intereses e impuestos.','Un margen estable o creciente suele ser favorable; compara solo negocios similares. Costco tiene márgenes inferiores a Microsoft por naturaleza.','Un margen de 30% significa 30 de utilidad operativa por cada 100 vendidos.'],
revenue_growth:['Crecimiento de ingresos','Variación porcentual de ventas frente a un periodo comparable.','Es favorable cuando aumenta junto con utilidades y generación de efectivo; no basta crecer solo en ventas.','Ventas que pasan de 100 a 115: crecimiento de 15%.'],
operating_cashflow:['CFO · Flujo operativo','Efectivo generado por las operaciones habituales antes del gasto en instalaciones y equipos.','Más efectivo operativo suele dar flexibilidad; analiza cambios de inventarios y cuentas por cobrar.','Utilidad de 100 con CFO de 30: no toda la ganancia se convirtió en efectivo.'],
free_cashflow:['FCF · Flujo libre','Efectivo operativo menos inversiones físicas en activos fijos (CapEx), en una definición frecuente.','Positivo y creciente suele ser favorable, pero puede bajar temporalmente porque una empresa está construyendo fábricas.','CFO 100 menos CapEx 35 equivale a FCF 65.'],
fcf_yield:['FCF yield','Flujo libre anual dividido entre el valor de mercado de la empresa.','Un valor mayor puede sugerir mejor precio de entrada, pero exige verificar que el flujo sea sostenible. No es un dividendo.','FCF yield 3%: 3 de FCF anual por cada 100 de capitalización.'],
roe:['ROE','Utilidad neta dividida entre patrimonio contable promedio.','Un ROE alto puede ser bueno o estar inflado por deuda o por un patrimonio pequeño.','ROE 20%: utilidad anual de 20 por cada 100 de patrimonio, no rendimiento garantizado de la acción.'],
debt_to_equity_pct:['Deuda / patrimonio','Deuda financiera dividida entre el patrimonio contable.','Más deuda puede elevar el riesgo, aunque el valor adecuado cambia por industria; las recompras también alteran el indicador.','100%: deuda financiera similar al patrimonio contable.'],
volatility:['Volatilidad anualizada','Magnitud de las variaciones de rendimientos, aproximada desde datos diarios.','Más volatilidad implica oscilaciones mayores, pero no determina la probabilidad exacta de perder capital en 5 años.','20% de volatilidad no significa una caída segura de 20%.'],
var95:['VaR histórico diario (95%)','Umbral de pérdida superado aproximadamente el 5% de los días en la muestra.','No es la peor pérdida posible; las crisis futuras pueden ser peores que las observadas.','VaR 2%: aproximadamente uno de cada veinte días históricos tuvo una pérdida igual o mayor.'],
es95:['CVaR / Expected Shortfall (95%)','Promedio de pérdidas dentro del 5% peor de los días históricos.','Ayuda a estimar severidad de la cola, sin prometer una pérdida máxima.','Si VaR es 2% y ES 3.5%, la pérdida promedio en los peores días fue 3.5%.'],
drawdown:['Máximo drawdown histórico','Peor caída acumulada desde un máximo previo hasta un mínimo posterior.','Muestra la profundidad de una crisis pasada, no cuál será la próxima.','Pasar de 100 a 60 implica drawdown de −40%.'],
correlation:['Correlación','Mide cuánto se parecen los movimientos diarios de dos activos, de −1 a +1.','Cercana a +1 indica poca diversificación entre ellos; cambia durante las crisis.','+0.8 indica movimientos habitualmente parecidos.'],
weights:['Ponderación','Porcentaje de tu capital total destinado a una posición.','Un peso alto aumenta la exposición al riesgo específico de una empresa.','30% TSM: treinta de cada cien pesos de cartera en TSM.']};
const lookup={'P/U últimos 12 meses':'trailing_pe','P/U forward':'forward_pe','Margen operativo':'operating_margin','Crecimiento ingresos':'revenue_growth','CFO':'operating_cashflow','FCF':'free_cashflow','ROE':'roe','Deuda / patrimonio':'debt_to_equity_pct','Volatilidad anualizada':'volatility','VaR histórico diario (95%)':'var95','CVaR / Expected Shortfall (95%)':'es95','Máximo drawdown histórico':'drawdown'};
const deeper={
trailing_pe:{formula:'Precio actual ÷ EPS real de los últimos 12 meses.',positive:'Es más atractivo cuando no depende de ganancias extraordinarias y el crecimiento futuro compensa el múltiplo.',negative:'Puede ser elevado por expectativas excesivas o bajo porque las utilidades son cíclicas y podrían caer.',next:'EPS ajustado, P/U forward, crecimiento previsto, FCF yield.'},
forward_pe:{formula:'Precio actual ÷ EPS estimado para los próximos 12 meses.',positive:'Una caída frente al P/U pasado puede reflejar una mejora prevista de utilidades.',negative:'Las estimaciones no son hechos: si cambian las guías, el múltiplo real cambia.',next:'Guía de utilidades, resultados recientes, dispersión de estimaciones y CapEx.'},
operating_margin:{formula:'Utilidad operativa ÷ ingresos × 100.',positive:'Es favorable cuando se mantiene o mejora a lo largo de varios periodos y frente a competidores similares.',negative:'Una caída puede reflejar presión de precios, costos crecientes, depreciación o menor escala.',next:'Margen bruto, crecimiento de ventas, depreciación y FCF.'},
revenue_growth:{formula:'(Ingresos actuales / ingresos del periodo comparable − 1) × 100.',positive:'Es más saludable cuando proviene de demanda real y también crecen utilidades y caja.',negative:'Ventas mayores con márgenes y cobros deteriorándose no prueban creación de valor.',next:'Crecimiento orgánico, volumen, márgenes y CFO.'},
operating_cashflow:{formula:'Entradas y salidas de efectivo de actividades operativas, según estado de flujos.',positive:'CFO recurrentemente positivo respalda inversión, deuda y flexibilidad de la empresa.',negative:'Un solo trimestre bajo puede deberse a estacionalidad o capital de trabajo; la debilidad persistente preocupa.',next:'Utilidad neta, cobros, inventario, CapEx y FCF.'},
free_cashflow:{formula:'FCF aproximado = flujo operativo (CFO) − inversiones físicas (CapEx).',positive:'FCF recurrente positivo permite financiar crecimiento, disminuir deuda y distribuir efectivo.',negative:'FCF bajo por proyectos con retorno alto no es igual a FCF bajo por operación débil.',next:'CFO, CapEx de crecimiento y mantenimiento, deuda y recompras.'},
fcf_yield:{formula:'Flujo libre de los últimos 12 meses ÷ capitalización bursátil × 100.',positive:'Si el flujo es sostenible, un valor mayor suele dar más flujo por cada dólar invertido.',negative:'Un valor menor suele reflejar mayores expectativas; valores altos pueden esconder flujos extraordinarios.',next:'P/U, crecimiento de FCF, CapEx y riesgo del negocio.'},
roe:{formula:'Utilidad neta anual ÷ patrimonio contable promedio × 100.',positive:'ROE consistente y elevado sin deuda excesiva puede mostrar eficiencia del capital.',negative:'Puede inflarse artificialmente por recompras, pérdidas acumuladas o un patrimonio muy pequeño.',next:'ROIC, deuda/patrimonio, utilidad neta y capital contable.'},
debt_to_equity_pct:{formula:'Deuda financiera ÷ patrimonio contable × 100.',positive:'Una deuda sostenible respecto a la capacidad de generar caja mejora la resistencia.',negative:'Un valor alto indica dependencia de acreedores, pero el dato aislado es insuficiente.',next:'Deuda neta/EBITDA, efectivo, intereses y vencimientos.'},
volatility:{formula:'Desviación estándar de los rendimientos diarios × raíz cuadrada de 252.',positive:'Menos volatilidad implica un trayecto históricamente menos cambiante, no ausencia de riesgo.',negative:'No mide directamente una pérdida permanente de capital ni todos los eventos extremos.',next:'Máximo drawdown, VaR, ES y concentración por sector.'},
var95:{formula:'Percentil 95 de las pérdidas diarias históricas observadas.',positive:'Puede ayudar a comparar la magnitud de pérdidas frecuentes entre asignaciones.',negative:'No significa que la pérdida no pueda superar ese valor: precisamente mide un umbral.',next:'Expected Shortfall, periodo usado, escenarios de estrés y USD/MXN.'},
es95:{formula:'Promedio de las pérdidas que exceden el VaR 95% histórico.',positive:'ES menor indica que la cola histórica tuvo pérdidas menos severas.',negative:'No es una pérdida máxima ni cubre crisis distintas de las observadas.',next:'VaR, drawdown, correlaciones en crisis y tamaño de posiciones.'},
drawdown:{formula:'Mínimo de (valor de cartera / máximo histórico acumulado − 1).',positive:'Un drawdown menos profundo ayuda a mantener la estrategia sin liquidar por miedo.',negative:'Un drawdown grande requiere mucho crecimiento posterior: caer 50% exige luego subir 100% para recuperar.',next:'Tiempo de recuperación, liquidez personal, VaR y correlaciones.'},
correlation:{formula:'Coeficiente de correlación de rendimientos entre −1 y +1.',positive:'Correlaciones moderadas o bajas pueden mejorar la diversificación.',negative:'En crisis las correlaciones pueden crecer y las posiciones pueden caer a la vez.',next:'Covarianzas, contribuciones al riesgo y exposiciones comunes.'},
weights:{formula:'Valor de posición / valor total invertido × 100.',positive:'Pesos razonados permiten controlar el daño por equivocarse en una tesis.',negative:'Una empresa con peso excesivo puede dominar las pérdidas de toda la cartera.',next:'Concentración de sectores, factor IA, rebalanceos y comisiones.'},
fx:{formula:'Tipo de cambio: pesos por dólar estadounidense.',positive:'Una subida del dólar puede elevar tu cartera medida en MXN si los activos en USD permanecen constantes.',negative:'Una apreciación del peso reduce el valor en MXN de posiciones en USD.',next:'Rendimiento local de las acciones, costos de conversión y periodo de comparación.'}
};
const businessIndicator={
 TSM:{free_cashflow:'En TSMC el FCF puede oscilar mucho por las nuevas fábricas; revisa retorno de las inversiones y crecimiento de chips avanzados.',operating_margin:'Sus márgenes dependen de precio, mezcla de nodos de fabricación y utilización de plantas.',trailing_pe:'Contrasta el múltiplo con su crecimiento esperado de EPS y el riesgo geopolítico de Taiwán.',forward_pe:'La utilidad estimada presupone expansión de producción avanzada: las nuevas fábricas también elevan depreciación.'},
 MSFT:{free_cashflow:'El FCF se ve afectado por CapEx de centros de datos; compara crecimiento Azure con esa inversión.',operating_margin:'El margen operativo refleja la escala de software y nube, pero la depreciación de IA puede presionarlo.',trailing_pe:'Microsoft puede justificar una prima por software recurrente, pero el precio exige monetización del CapEx.',revenue_growth:'No confundir crecimiento de Azure con crecimiento total: cada negocio tiene peso diferente.'},
 V:{free_cashflow:'Visa es relativamente ligera en activos físicos; verifica litigios y recompra de acciones antes de interpretar el FCF.',operating_margin:'El margen suele ser muy alto frente a comercio minorista porque opera una infraestructura de pagos.',debt_to_equity_pct:'Las recompras reducen patrimonio y pueden aumentar esta razón sin que la deuda crezca.',revenue_growth:'Importan volumen de pagos, transacciones procesadas, pagos internacionales e incentivos comerciales.'},
 COST:{operating_margin:'Un margen operativo bajo puede ser saludable: Costco compite por precio, volumen y rotación.',trailing_pe:'Una marca defensiva no significa acción barata: un P/U alto puede reducir retornos aunque las ventas crezcan.',free_cashflow:'La caja depende de inventario, expansión de almacenes y membresías; evalúa varios ejercicios.',revenue_growth:'Separa aperturas nuevas de ventas comparables y observa las renovaciones de membresía.'}
};
const businessNames={TSM:'TSMC',MSFT:'Microsoft',V:'Visa',COST:'Costco',cartera:'tu cartera'};
const special={TSM:'TSMC necesita mucho CapEx para fabricar chips avanzados. Vigila márgenes, inversión y crecimiento de utilidad.',MSFT:'Microsoft tiene ingresos recurrentes; el aumento de inversión en IA puede reducir temporalmente su flujo libre.',V:'Visa tiene pocos activos físicos relativos a ingresos, pero enfrenta presión regulatoria y comercial.',COST:'Costco tiene márgenes comerciales bajos por diseño; sus membresías y rotación de inventarios son fundamentales.'};
const esc=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
let active=null;
function ticker(){return document.querySelector('#company-tabs .active')?.dataset.company||document.querySelector('#academy-company')?.value||'TSM'}
function read(id,t){const m=window.atlasEducationState?.()?.data?.symbols?.[t]?.metrics;const v=m?.[id];if(typeof v==='number'&&Number.isFinite(v)){if(['operating_margin','revenue_growth','roe','fcf_yield'].includes(id))return (v*100).toFixed(1)+'%';if(id==='debt_to_equity_pct')return v.toFixed(1)+'%';if(['forward_pe','trailing_pe'].includes(id))return v.toFixed(1)+'×';return v.toLocaleString('es-MX')+' '+(m.financial_currency||'')}const r={'volatility':'risk-vol','var95':'risk-var','es95':'risk-es','drawdown':'risk-dd'}[id];return r?document.getElementById(r)?.textContent:'—'}
// Interpretación educativa: utiliza cifras reales del dashboard cuando existen.
// Nunca convierte una regla general en una calificación automática de compra/venta.
const numeric=v=>typeof v==='number'&&Number.isFinite(v);
const fmt=(v,d=1)=>new Intl.NumberFormat('es-MX',{maximumFractionDigits:d,minimumFractionDigits:d}).format(v);
const percent=(v,d=1)=>fmt(v*100,d)+'%';
const money=(v,ccy)=>{
 if(!numeric(v))return 'dato no disponible';
 const abs=Math.abs(v),prefix=v<0?'−':'';
 const units=abs>=1e12?['billones',1e12]:abs>=1e9?['mil millones',1e9]:abs>=1e6?['millones',1e6]:['',1];
 return `${prefix}${fmt(abs/units[1],2)} ${units[0]} ${ccy||''}`.replace(/ +/g,' ').trim();
};
const currentMetrics=t=>window.atlasEducationState?.()?.data?.symbols?.[t]?.metrics||{};
const currentQuote=t=>window.atlasEducationState?.()?.data?.symbols?.[t]||{};
function getReading(id,t){
 if(t==='cartera'){
  const elementId={volatility:'risk-vol',var95:'risk-var',es95:'risk-es',drawdown:'risk-dd'}[id];
  const label=elementId?document.getElementById(elementId)?.textContent?.trim():null;
  const match=label?.replace(',', '.').match(/-?\d+(?:\.\d+)?/);
  return {number:match?Number(match[0]):null,label:label&&label!=='—'?label:'No disponible',date:null};
 }
 const m=currentMetrics(t),v=m[id];
 return {number:numeric(v)?v:null,label:read(id,t)||'No disponible',date:m.as_of||null};
}
const businessFocus={
 TSM:{
  trailing_pe:'TSMC tiene una ventaja en fabricación avanzada, pero opera en un sector que puede pasar de escasez a sobrecapacidad. El múltiplo debe compensar el riesgo de Taiwán y las inversiones en nuevas fábricas.',
  forward_pe:'La demanda de chips avanzados impulsa las estimaciones; vigila si los nuevos nodos elevan los márgenes después de la depreciación y el CapEx.',
  operating_margin:'Su margen depende de la ocupación de las fábricas, la mezcla de nodos y el rendimiento de producción. Un trimestre récord no garantiza el margen del siguiente ciclo.',
  revenue_growth:'El crecimiento de chips para centros de datos puede impulsar ventas, pero también exige construir capacidad. Contrasta la facturación con CapEx y FCF.',
  operating_cashflow:'La generación de caja operativa permite financiar fábricas muy costosas. Examina cuánto se consume después en inversión física.',
  free_cashflow:'La construcción de plantas y la expansión de 2 nm pueden reducir el FCF temporalmente. Pregunta si esas plantas producirán retornos adecuados durante varios años.',
  fcf_yield:'Sus estados pueden reportarse en TWD aunque el ADR cotice en USD. Si las monedas no coinciden, no calcules el rendimiento usando cifras sin convertir.',
  roe:'Un ROE alto puede reflejar rentabilidad tecnológica extraordinaria. Confirma que también exista buena rentabilidad sobre el capital invertido y no solo efectos contables.',
  debt_to_equity_pct:'Considera deuda financiera, abundancia de caja y compromisos de construcción. Un balance solvente no elimina la exposición geopolítica.'
 },
 MSFT:{
  trailing_pe:'El software empresarial, la nube y contratos recurrentes pueden justificar una prima, pero el precio presupone monetizar el fuerte gasto en infraestructura de IA.',
  forward_pe:'Compara las utilidades previstas con el crecimiento de Azure, el avance de Copilot y la depreciación creciente de los centros de datos.',
  operating_margin:'El software tiene margen estructuralmente alto. Presta atención a si la depreciación y los costos de IA deterioran la rentabilidad de la nube.',
  revenue_growth:'Separa el crecimiento de Azure del de Microsoft total. La nube puede acelerarse aunque segmentos maduros avancen más despacio.',
  operating_cashflow:'Licencias, suscripciones y pagos empresariales favorecen el cobro recurrente; no confundas el CFO con el efectivo disponible después de invertir.',
  free_cashflow:'CFO puede subir y FCF bajar si el CapEx de centros de datos crece más rápido. La prueba será si la nueva infraestructura genera caja suficiente.',
  fcf_yield:'Una valuación elevada puede hacer que el FCF yield sea bajo, aunque Microsoft sea rentable. Revisa si el crecimiento compensa lo que pagas por el flujo.',
  roe:'Las recompras y el apalancamiento pueden modificar el patrimonio contable. Combina ROE con margen operativo y rentabilidad del capital.',
  debt_to_equity_pct:'La capacidad de pago depende tanto del efectivo como de los flujos recurrentes; analiza también CapEx comprometido y vencimientos.'
 },
 V:{
  trailing_pe:'Visa cobra por uso de su red de pagos y puede crecer sin prestar directamente a la mayoría de los consumidores. La calidad de esa red suele merecer una prima, pero no ilimitada.',
  forward_pe:'El crecimiento de operaciones internacionales y servicios adicionales puede sostener el EPS, pero mayores incentivos comerciales pueden frenar su avance.',
  operating_margin:'Opera una infraestructura de pagos con relativamente pocos activos físicos. Su margen puede ser mucho mayor que el de Costco, sin que ello signifique una mejor inversión al precio actual.',
  revenue_growth:'Sigue el volumen de pagos, los pagos transfronterizos y el número de transacciones. Los incentivos a emisores pueden crecer más rápido que las ventas.',
  operating_cashflow:'Las transacciones generan cobros recurrentes, pero movimientos de litigios y capital circulante pueden alterar un ejercicio concreto.',
  free_cashflow:'El negocio es poco intensivo en fábricas. Comprueba si FCF cubre dividendos y recompras, y cuánto consumen litigios e incentivos.',
  fcf_yield:'Un flujo estable puede justificar una prima de calidad, pero pagar demasiado reduce el rendimiento potencial incluso con crecimiento.',
  roe:'Las recompras reducen el patrimonio y pueden elevar el ROE sin cambiar la eficiencia operativa del negocio.',
  debt_to_equity_pct:'No confundas recompras que reducen el patrimonio con aumentos de deuda. Revisa caja neta, litigios y obligaciones futuras.'
 },
 COST:{
  trailing_pe:'Costco tiene ventas frecuentes, renovación de membresías y alta confianza del consumidor. Ese carácter defensivo suele elevar el múltiplo: cuidado con pagar demasiado por estabilidad.',
  forward_pe:'El crecimiento esperado depende de ventas comparables, aperturas, renovaciones y eficiencia. Una valoración alta exige muchos años de ejecución consistente.',
  operating_margin:'Un margen operativo bajo es parte del modelo: precios bajos, volumen alto, rotación de inventario y cuotas de membresía. Es más importante que sea estable a que iguale el margen de una tecnológica.',
  revenue_growth:'Separa las aperturas de nuevas tiendas de las ventas comparables. Revisa tráfico de clientes, ticket promedio y renovación de membresías.',
  operating_cashflow:'La rotación rápida de inventario y las membresías ayudan a financiar operaciones; revisa estacionalidad, pagos a proveedores y cambios en inventarios.',
  free_cashflow:'Puede financiar aperturas y distribuir efectivo sin alto apalancamiento, pero el ritmo de nuevas tiendas aumenta el CapEx.',
  fcf_yield:'Costco suele cotizar cara por su estabilidad. Si el FCF yield es bajo, necesitas que el flujo futuro crezca mucho para justificar el precio.',
  roe:'Un ROE alto puede reflejar eficiencia y rotación, pero también distribución de capital y recompras. Evalúa balance junto con flujo.',
  debt_to_equity_pct:'Su exposición financiera suele ser menos importante que la recurrencia de caja y el financiamiento del inventario, pero analiza arrendamientos y caja neta.'
 }
};
function analyze(id,t){
 const m=currentMetrics(t),q=currentQuote(t),r=getReading(id,t),x=r.number;
 const company=businessNames[t]||t;
 const simpleExample=terms[id]?.[3]||'';
 let headline='Qué significa este resultado';
 let conclusion='El número aislado no basta para decidir si el negocio está mejorando ni si el precio de la acción es atractivo.';
 let impact='Una inversión se evalúa combinando tendencias operativas, generación de caja, valuación y riesgos particulares.';
 let example=simpleExample;
 let compare='Revisa varios trimestres, el periodo de cada dato y empresas comparables del mismo sector.';
 let limitation='Los datos de mercado pueden estar desfasados y algunas métricas no indican con precisión el periodo cubierto. No constituyen una señal automática de compra.';
 let signal='neutral';
 const has=numeric(x);
 if(t==='cartera'){
  const capital=10000,abs=has?Math.abs(x):null;
  const label=has?fmt(abs,2)+'%':'no disponible';
  const cash=has?fmt(capital*abs/100,0):'—';
  if(id==='volatility'){
   headline='La magnitud de los altibajos de tu cartera';
   conclusion=has?`La volatilidad anualizada observada es ${label}. Describe cuánto han fluctuado los rendimientos en la muestra, no cuánto ganarás o perderás en un año.`:'Sin una serie histórica suficiente no podemos cuantificar cuánto oscila la cartera.';
   impact='Un perfil agresivo puede tolerar más movimientos de precio, pero conviene vigilar si las cuatro compañías caen simultáneamente por la misma causa.';
   example='Una volatilidad de 25% NO significa 25% de probabilidad de perder ni una caída de 25%. Es una desviación típica anualizada.';
   compare='Comparar con un ETF global y revisar VaR, ES, máximo drawdown y correlaciones.';
  } else if(id==='var95'){
   headline='Un umbral de pérdida diaria, no un límite';
   conclusion=has?`En los rendimientos históricos de esta cartera, aproximadamente 5% de los días fueron tan malos o peores que una pérdida de ${label}.`:'No hay un VaR diario estimado con datos suficientes.';
   example=has?`Con una cartera hipotética de $${fmt(capital,0)} MXN, ese umbral representa aproximadamente $${cash} MXN de pérdida en un día. Puede haber pérdidas mucho mayores.`:simpleExample;
   impact='La medida ayuda a dimensionar pérdidas frecuentes en la cola, pero no garantiza protección contra una caída excepcional.';
   compare='Comparar con ES al 95%, máximo drawdown y episodios de crisis.';
  } else if(id==='es95'){
   headline='Qué tan fuertes fueron los peores días';
   conclusion=has?`Dentro del 5% de días más desfavorables, la pérdida media histórica de la cartera fue aproximadamente ${label}.`:'No hay una estimación histórica verificable de ES.';
   example=has?`Sobre $${fmt(capital,0)} MXN, eso representa alrededor de $${cash} MXN como promedio de pérdidas en esos días extremos, no la peor pérdida posible.`:simpleExample;
   impact='El ES es especialmente útil para un inversionista agresivo porque mira la severidad de las caídas más allá del umbral VaR.';
   compare='Comparar con VaR 95%, concentración sectorial y capacidad financiera para soportar pérdidas.';
  } else if(id==='drawdown'){
   headline='La mayor caída desde un máximo anterior';
   conclusion=has?`El peor descenso observado en el periodo fue de aproximadamente ${label}. No significa que la cartera haya terminado ese periodo con esa pérdida.`:'No hay suficientes precios para calcular la peor caída histórica.';
   const recovery=has&&abs<100?(100/(100-abs)-1)*100:null;
   example=has?`Una cartera que alcanzó $${fmt(capital,0)} MXN habría caído alrededor de $${cash} MXN desde ese máximo. Para recuperar el máximo desde el mínimo necesitaría subir ${recovery===null?'más de 100':fmt(recovery,1)}%.`:simpleExample;
   impact='Esta medida refleja cuánto podrías haber visto disminuir tu patrimonio antes de una eventual recuperación.';
   compare='Ver fechas del máximo y mínimo y cuánto duró la recuperación; comparar contra índices y otros portafolios.';
  } else if(id==='correlation'){
   headline='Diversificar exige entender qué se mueve al mismo tiempo';
   conclusion='No hay un único número de correlación para toda la cartera: se calcula entre pares de activos. TSMC y Microsoft comparten exposición a la inversión en tecnología, aunque tengan modelos diferentes.';
   impact='Dos acciones pueden caer juntas en un shock de IA; Visa y Costco agregan fuentes de ingresos distintas, pero tampoco son inmunes a una recesión.';
   compare='Revisar la matriz de correlaciones y contrastar periodos normales contra crisis.';
  } else if(id==='weights'){
   headline='Cuánto pesa cada tesis en tus resultados';
   conclusion='Una ponderación no dice si la empresa es buena: indica cuánto te afecta acertar o equivocarte con ella.';
   example='Si tienes 30% en TSM y TSM cae 40% mientras las otras no cambian, el portafolio cae aproximadamente 12%.';
   impact='Evita que una sola tesis, sector o divisa domine el patrimonio sin intención.';
   compare='Revisar pesos actuales y objetivos, correlaciones, comisiones y fuentes de ingreso relacionadas.';
  }
  limitation='Son estadísticas calculadas con rendimientos históricos diarios en MXN y supuestos de la cartera. No estiman con precisión probabilidades de pérdidas a cinco años y pueden subestimar cambios de régimen.';
  return {headline,conclusion,impact,example,compare,limitation,signal};
 }
 if(!has){
  return {headline:'No hay una cifra verificable para interpretarla',conclusion:'El proveedor no incluye este dato o el cálculo fue omitido por incompatibilidad de monedas o falta de información.',impact:businessFocus[t]?.[id]||special[t]||impact,example:simpleExample,compare:deeper[id]?.next||compare,limitation:'No deducimos un valor faltante a partir de otra empresa. Si necesitas el dato, revisa el último reporte oficial de relaciones con inversionistas.',signal:'neutral'};
 }
 const v=fmt(x,1),pp=fmt(x*100,1),ccy=m.financial_currency||'moneda contable';
 if(id==='trailing_pe'||id==='forward_pe'){
  const past=id==='trailing_pe',other=numeric(m[past?'forward_pe':'trailing_pe'])?m[past?'forward_pe':'trailing_pe']:null;
  const impliedEPS=numeric(q.price)&&x>0?q.price/x:null;
  const earningsYield=x>0?100/x:null;
  headline=x<=0?'La utilidad no permite leer este múltiplo normalmente':x>=40?'Estás pagando una prima importante por sus beneficios':x>=25?'Estás pagando expectativas relevantes de calidad o crecimiento':'El precio por dólar de utilidad es relativamente más moderado';
  conclusion=x>0?`El múltiplo es ${v}×: por cada 1 dólar de utilidad ${past?'efectivamente generada en los últimos doce meses':'estimada para los próximos doce meses'}, pagas aproximadamente ${v} dólares por la acción. No es una promesa de recuperar la inversión en ${v} años.`:'La utilidad base es nula o negativa: este múltiplo no se interpreta de forma usual.';
  example=impliedEPS!==null?`Con un precio de ${fmt(q.price,2)} USD por ADR/acción, el EPS ${past?'histórico':'estimado'} implícito es ${fmt(impliedEPS,2)} USD. Un rendimiento de utilidades implícito cercano a ${fmt(earningsYield,1)}% no equivale a un dividendo ni a un rendimiento futuro.`:simpleExample;
  if(numeric(other)&&other>0&&x>0){
   const trailing=numeric(m.trailing_pe)?m.trailing_pe:null,forward=numeric(m.forward_pe)?m.forward_pe:null;
   const expectedChange=trailing&&forward?(trailing/forward-1)*100:null;
   compare=expectedChange!==null?`El P/U histórico mostrado es ${fmt(trailing,1)}× y el forward ${fmt(forward,1)}×. Eso implica una variación aproximada de EPS de ${expectedChange>=0?'+':''}${fmt(expectedChange,1)}% entre sus bases, si las estimaciones son comparables y se cumplen. Valida el periodo y si son utilidades ajustadas.`:deeper[id]?.next;
  }else compare='Contrasta con crecimiento de EPS, flujo libre, deuda y su propio P/U de los últimos años.';
  impact=x>=40?'Si el mercado deja de reconocer esa prima, la acción podría caer incluso aunque las utilidades sigan creciendo.':x>=25?'Para justificar el precio, el crecimiento futuro debe compensar la prima que estás pagando.':'Un múltiplo bajo puede ofrecer margen de seguridad, pero también reflejar problemas reales del negocio.';
  signal=x>=40?'watch':'neutral';
  limitation='El P/U mezcla precio de mercado con una utilidad contable (real o estimada). Ganancias extraordinarias, recompras y revisiones de EPS pueden distorsionar la comparación.';
 }else if(id==='operating_margin'){
  headline=x<0?'El negocio pierde dinero en la operación':'Cuánto conserva de cada 100 que vende';
  conclusion=`El margen operativo de ${pp}% significa que, por cada 100 unidades monetarias de ventas, quedan cerca de ${pp} unidades de utilidad operativa antes de intereses e impuestos.`;
  example=`Si la empresa facturara 1,000 ${ccy}, el beneficio operativo sería aproximadamente ${fmt(x*1000,1)} ${ccy}. Mejorar el margen en 1 punto porcentual agregaría 10 ${ccy} de utilidad por cada 1,000 de ventas, suponiendo todo lo demás constante.`;
  impact=t==='COST'?'En Costco un margen bajo puede ser coherente con precios agresivos y altísima rotación. Importa si se mantiene o mejora sin sacrificar la propuesta de valor.':x>=.3?'Es una proporción elevada, pero depende de la industria y del grado de integración de la empresa.':'La magnitud por sí sola no permite compararla con negocios de sectores diferentes.';
  compare='Comparar al menos cuatro trimestres equivalentes, margen bruto, evolución del CapEx y rentabilidad del capital.';
  limitation='No es flujo de caja: depreciación, provisiones, capital de trabajo y CapEx pueden cambiar el dinero disponible.';
 }else if(id==='revenue_growth'){
  const next=100*(1+x);
  headline=x<0?'Las ventas se contrajeron en el periodo':'El negocio está vendiendo más';
  conclusion=`El crecimiento reportado es ${pp}%. Indica que las ventas cambiaron esa proporción respecto al periodo comparable utilizado por el proveedor; no indica cuánto crecieron las utilidades.`;
  example=`Si antes vendía 100 millones, ahora serían aproximadamente ${fmt(next,1)} millones en la misma moneda y bajo una base comparable.`;
  impact=x>=.2?'Es un ritmo elevado que merece revisar si requiere mucha inversión y si genera márgenes sostenibles.':x<0?'Determina si hay menos unidades vendidas, menores precios, desinversiones o efectos cambiarios.':'Un crecimiento positivo puede ser satisfactorio o insuficiente según la industria, el ciclo y el precio de la acción.';
  compare=`En esta misma empresa, el margen operativo disponible es ${numeric(m.operating_margin)?percent(m.operating_margin):'no disponible'}. Contrasta crecimiento orgánico, utilidades, margen y CFO del mismo periodo.`;
  limitation='El proveedor puede ofrecer una tasa interanual trimestral o anual. Verifica periodo, divisa y efectos de adquisiciones antes de extrapolar.';
 }else if(id==='operating_cashflow'){
  headline=x<0?'La operación absorbió efectivo':'La operación generó efectivo';
  conclusion=`El flujo operativo reportado fue ${money(x,ccy)}. Refleja el movimiento neto de caja de la actividad habitual, incluyendo cobros, pagos e inventarios.`;
  example=`Por cada 100 unidades de flujo operativo hay que descontar lo que se reinvierte en equipos y propiedades; por eso CFO de 100 no equivale a 100 disponibles para dividendos.`;
  impact='Un CFO positivo sostenido es favorable, pero un año puede ser elevado porque la empresa retrasó pagos o cobró saldos anteriores.';
  compare=numeric(m.free_cashflow)?`El FCF reportado es ${money(m.free_cashflow,ccy)}. La diferencia frente a CFO es ${money(x-m.free_cashflow,ccy)}, que puede corresponder aproximadamente a inversiones según la definición del proveedor.`:'El FCF no está disponible: revisa CapEx y flujo operativo en el estado de flujos oficial.';
  limitation='El CFO de un solo ejercicio puede moverse por estacionalidad y capital de trabajo. Los periodos de CFO y FCF deben coincidir.';
 }else if(id==='free_cashflow'){
  headline=x<0?'El negocio consumió más caja de la que dejó tras inversión':'Quedó efectivo después de la inversión física';
  conclusion=`El flujo libre reportado es ${money(x,ccy)}. Suele representar lo que queda tras restar el CapEx al CFO; es una señal útil de flexibilidad financiera, no una transferencia directa al accionista.`;
  if(numeric(m.operating_cashflow)&&m.operating_cashflow!==0){
   const fraction=x/m.operating_cashflow;
   example=`Con CFO de ${money(m.operating_cashflow,ccy)}, el FCF equivale a ${percent(fraction)} de ese flujo. La diferencia de ${money(m.operating_cashflow-x,ccy)} es una aproximación de inversión neta bajo esta definición, sujeta al periodo y ajustes del proveedor.`;
  }
  impact=t==='TSM'||t==='MSFT'?'Las inversiones en fábricas o centros de datos pueden reducir el FCF durante la expansión. La pregunta es si esas inversiones generarán suficiente caja después.':'Comprueba si el flujo se repite en varios años y si alcanza para dividendos, recompras, deuda y crecimiento.';
  compare='Comparar CFO, CapEx, FCF de 3–5 años, crecimiento esperado y deuda neta.';
  limitation='El FCF de proveedores puede diferir de CFO − CapEx simple y no descuenta adquisiciones ni todas las obligaciones futuras.';
 }else if(id==='fcf_yield'){
  headline=x<0?'El flujo libre fue negativo':'Qué flujo compras por el precio bursátil';
  conclusion=`El FCF yield es ${pp}%. Por cada 100 unidades de capitalización bursátil, el negocio produjo aproximadamente ${pp} de FCF en el periodo de referencia.`;
  example=x>0?`El inverso del rendimiento equivale a aproximadamente ${fmt(1/x,1)}× FCF. Esto NO representa un interés que te pagarán; el efectivo puede reinvertirse o gastarse.`:'No es un rendimiento financiero positivo. Un FCF negativo requiere analizar la causa.';
  impact=x<.025?'El rendimiento de flujo es pequeño en relación con el precio: para obtener buen retorno bursátil probablemente dependas de fuerte crecimiento futuro.':'El flujo parece más visible respecto al precio, pero podría ser extraordinario o reflejar incertidumbre.';
  compare='Contrastar crecimiento de FCF, P/U, retorno sobre capital y dividendos/recompras reales.';
  limitation='La capitalización y el FCF deben estar expresados en la misma moneda y con periodos consistentes. El yield no promete retorno al inversionista.';
 }else if(id==='roe'){
  headline=x<=0?'El retorno sobre patrimonio no es positivo':'Qué utilidad generó el capital contable';
  conclusion=`El ROE reportado es ${pp}%. A grandes rasgos, por cada 100 unidades de patrimonio contable promedio, la empresa generó aproximadamente ${pp} unidades de utilidad.`;
  example='Si el patrimonio promedio fuera 100 millones y el ROE 20%, la utilidad neta sería aproximadamente 20 millones. Eso NO significa que la acción vaya a subir 20%.';
  impact=x>.30?'Es un ROE elevado, pero antes de celebrarlo revisa si un patrimonio contable reducido o mucha deuda lo están inflando.':'Es una señal de rentabilidad contable, pero debe contrastarse con el costo de capital y la deuda.';
  compare=`La deuda/patrimonio informada es ${numeric(m.debt_to_equity_pct)?fmt(m.debt_to_equity_pct,1)+'%':'no disponible'}. Contrasta ROE, ROIC, margen neto y recompra de acciones.`;
  limitation='El ROE puede aumentar porque baja el denominador (patrimonio) y no porque el negocio gane más dinero.';
 }else if(id==='debt_to_equity_pct'){
  headline=x>=100?'La deuda es comparable o superior al patrimonio':'El peso de la deuda frente al patrimonio';
  conclusion=`La razón reportada es ${v}%. Por cada 100 unidades de patrimonio contable, la deuda financiera equivale aproximadamente a ${v} unidades.`;
  example=`Si hubiera 100 millones de patrimonio, corresponderían ${v} millones de deuda financiera. No significa que la empresa deba todo su valor a los bancos.`;
  impact=x>=100?'Es importante conocer vencimientos, intereses y caja antes de considerar prudente ese apalancamiento.':'Es menor al patrimonio, pero una razón baja no garantiza ausencia de estrés financiero.';
  compare=numeric(m.total_cash)&&numeric(m.total_debt)?`La fuente muestra efectivo aproximado de ${money(m.total_cash,ccy)} y deuda de ${money(m.total_debt,ccy)}. Revisa definiciones y si ambos son del mismo cierre.`:'Completa el análisis con efectivo, deuda neta/EBITDA y cobertura de intereses.';
  limitation='El patrimonio cambia por recompra de acciones y ajustes contables. No mezcles deuda/patrimonio con deuda neta/EBITDA.';
 }
 return {headline,conclusion,impact,example,compare,limitation,signal};
}
function open(id,t){
 if(!terms[id])return;
 active={id,t};
 const [name,definition,,exampleDefault]=terms[id];
 const measure=getReading(id,t),r=analyze(id,t),company=businessNames[t]||t;
 const root=document.getElementById('academy-modal');
 const date=measure.date?new Date(measure.date).toLocaleDateString('es-MX',{year:'numeric',month:'short',day:'numeric'}):'periodo no confirmado';
 const focus=businessFocus[t]?.[id]||special[t]||'En tu cartera, interpreta el valor junto con la concentración y la incertidumbre de mercado.';
 root.innerHTML=`<div class="academy-backdrop" data-close="1"></div>
 <section class="academy-dialog academy-dialog-detailed" role="dialog" aria-modal="true" aria-labelledby="academy-title" tabindex="-1">
 <button class="academy-close" data-close="1" aria-label="Cerrar explicación">✕</button>
 <p class="academy-kicker">ATLAS ACADEMY · ${esc(company)}${t==='cartera'?'':` · ${esc(t)}`}</p>
 <h2 id="academy-title">${esc(name)}</h2>
 <p class="academy-lead">${esc(definition)}</p>
 <div class="academy-current"><span class="academy-current-label">Valor registrado en ATLAS</span><b>${esc(measure.label)}</b><small>Fuente de mercado · Fecha de referencia: ${esc(date)}. Confirma el periodo del indicador con el reporte oficial.</small></div>
 <div class="academy-verdict"><span class="academy-kicker">QUÉ SIGNIFICA EN ESTE CASO</span><h3>${esc(r.headline)}</h3><p>${esc(r.conclusion)}</p></div>
 <div class="academy-lesson-grid"><article class="academy-lesson"><h3>¿Por qué importa para tu inversión?</h3><p>${esc(r.impact)}</p></article><article class="academy-lesson"><h3>Ejemplo con números</h3><p>${esc(r.example||exampleDefault)}</p></article></div>
 <div class="academy-focus"><h3>Particularidades de ${esc(company)}</h3><p>${esc(focus)}</p></div>
 <div class="academy-lesson-grid"><article class="academy-lesson"><h3>Cómo se calcula</h3><p>${esc(deeper[id]?.formula||definition)}</p></article><article class="academy-lesson"><h3>Qué debes revisar ahora</h3><p>${esc(r.compare)}</p></article></div>
 <div class="academy-signal-grid"><div><h3>Sería una buena señal si…</h3><p>${esc(deeper[id]?.positive||terms[id][2])}</p></div><div><h3>Sería preocupante si…</h3><p>${esc(deeper[id]?.negative||terms[id][2])}</p></div></div>
 <div class="academy-caution"><h3>Lo que todavía no podemos concluir</h3><p>${esc(r.limitation)}</p></div>
 <div class="academy-actions"><button id="academy-ask" type="button">✦ Profundizar con ChatGPT</button><button id="academy-copy" type="button">Copiar pregunta</button></div>
 <p class="academy-foot">Estas explicaciones son educativas y se calculan localmente a partir de los datos disponibles. No constituyen asesoría ni señales automáticas de compra. ChatGPT se abre en otra pestaña, sin clave ni API de pago.</p>
 </section>`;
 root.hidden=false;document.body.classList.add('academy-open');root.querySelector('.academy-dialog')?.focus();
}
function close(){const root=document.getElementById('academy-modal');if(root){root.hidden=true;root.innerHTML=''}document.body.classList.remove('academy-open');active=null}
function prompt(){
 const [name,definition]=terms[active.id],r=analyze(active.id,active.t),reading=getReading(active.id,active.t);
 return `Estoy aprendiendo finanzas con ATLAS. Empresa: ${businessNames[active.t]||active.t}. Indicador: ${name}. Valor mostrado: ${reading.label}. Definición: ${definition}. Mi dashboard interpreta: "${r.conclusion}". Contexto de negocio: ${businessFocus[active.t]?.[active.id]||special[active.t]||'cartera concentrada de largo plazo'}. Explícame paso a paso, en español mexicano, sin jerga innecesaria: (1) qué representa el resultado y cómo se calcula, (2) por qué puede ser favorable o preocupante específicamente aquí, (3) una comparación con un ejemplo numérico, (4) qué deberíamos revisar en los últimos reportes oficiales, (5) qué escenario haría cambiar la tesis. Distingue cifras verificadas, supuestos y fechas; no inventes métricas faltantes ni conviertas un solo indicador en recomendación de compra.`;
}
function catalog(){const root=document.getElementById('academy-list');if(!root)return;const q=(document.getElementById('academy-filter')?.value||'').toLowerCase();root.innerHTML=Object.entries(terms).filter(([id,v])=>v.join(' ').toLowerCase().includes(q)).map(([id,v])=>`<article class="academy-card"><h3>${esc(v[0])}</h3><p>${esc(v[1])}</p><button data-metric="${esc(id)}">Explicar e interpretar ↗</button></article>`).join('')}
function enhance(){document.querySelectorAll('#company-detail .metric').forEach(c=>{if(c.querySelector('[data-metric]'))return;const id=lookup[c.querySelector('small')?.textContent?.trim()];if(id){const btn=document.createElement('button');btn.className='academy-mini';btn.textContent='ⓘ Entender indicador';btn.dataset.metric=id;c.append(btn)}});document.querySelectorAll('#riesgo .risk-stats .stat').forEach(c=>{if(c.querySelector('[data-metric]'))return;const id=lookup[c.querySelector('.stat-label')?.textContent?.trim()];if(id){const btn=document.createElement('button');btn.className='academy-mini';btn.textContent='ⓘ Entender riesgo';btn.dataset.metric=id;btn.dataset.portfolio='1';c.append(btn)}})}
function init(){const mount=document.getElementById('academy-app');if(!mount)return;mount.innerHTML='<div class="academy-toolbar"><label>Buscar un indicador<input id="academy-filter" placeholder="Ej. P/U, flujo, volatilidad"/></label><label>Empresa de referencia<select id="academy-company"><option value="TSM">TSMC</option><option value="MSFT">Microsoft</option><option value="V">Visa</option><option value="COST">Costco</option></select></label></div><div id="academy-list" class="academy-list"></div>';document.getElementById('academy-filter').addEventListener('input',catalog);catalog();enhance();const detail=document.getElementById('company-detail');if(detail)new MutationObserver(enhance).observe(detail,{childList:true});document.addEventListener('click',async e=>{const metric=e.target.closest('[data-metric]');if(metric){open(metric.dataset.metric,metric.dataset.portfolio?'cartera':(metric.closest('#company-detail')?ticker():(document.getElementById('academy-company')?.value||ticker())));return}if(e.target.closest('[data-close]')){close();return}if(e.target.id==='academy-ask'&&active){const p=prompt();window.open('https://chatgpt.com/?q='+encodeURIComponent(p),'_blank','noopener,noreferrer')}if(e.target.id==='academy-copy'&&active){try{await navigator.clipboard.writeText(prompt());e.target.textContent='✓ Copiado'}catch{window.prompt('Copia esta pregunta:',prompt())}}});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&active)close()})}
document.addEventListener('DOMContentLoaded',init);
})();
