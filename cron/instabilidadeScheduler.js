/**
 * Scheduler simples (fallback) para o servidor quando não há node-cron instalado.
 * Exporta startScheduler(interval) e stopScheduler().
 *
 * - interval aceita:
 *    - número em milissegundos como string ou number (ex: "300000" ou 300000)
 *    - padrão cron do tipo "*/5 * * * *" (extrai o 5 e usa como minutos)
 *    - se inválido, usa 5 minutos por padrão
 */
let _intervalId = null;

function _parseIntervalToMs(interval) {
  const defaultMs = 5 * 60 * 1000; // 5 minutos
  if (!interval) return defaultMs;
  if (typeof interval === "number") return interval;
  if (/^\d+$/.test(String(interval))) return parseInt(interval, 10);
  // tenta extrair "*/N" do padrão cron como minutos
  const m = String(interval).match(/^\*\/(\d+)/);
  if (m && m[1]) {
    const minutes = parseInt(m[1], 10);
    if (!isNaN(minutes) && minutes > 0) return minutes * 60 * 1000;
  }
  return defaultMs;
}

function startScheduler(interval) {
  stopScheduler();
  const ms = _parseIntervalToMs(interval);
  console.log(`[Scheduler] Iniciando scheduler mínimo (interval=${ms}ms)`);
  // Execução imediata e agendada
  _runCheck();
  _intervalId = setInterval(_runCheck, ms);
}

function _runCheck() {
  // Aqui você pode chamar funções reais de monitoramento.
  // Mantive simples para evitar dependências extras.
  try {
    console.log(`[Scheduler] Execução em ${new Date().toISOString()}`);
    // Exemplo: verificar integridade, logs, etc.
    // TODO: integrar com serviço real se necessário.
  } catch (err) {
    console.error("[Scheduler] Erro durante execução:", err && err.message);
  }
}

function stopScheduler() {
  if (_intervalId) {
    clearInterval(_intervalId);
    _intervalId = null;
    console.log("[Scheduler] Parado.");
  }
}

module.exports = {
  startScheduler,
  stopScheduler,
};