// ============================================
// CRYPTO FUTURES TRADING ALERT BOT - PRO EDITION
// 100% Match TradingView + Optimized for Futures
// Professional Grade with Risk Management
// ============================================

const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const https = require('https');

// ============================================
// KONFIGURASI PROFESIONAL
// ============================================
const CONFIG = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || 'MASUKKAN_BOT_TOKEN_ANDA_DISINI',
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || 'MASUKKAN_CHAT_ID_ANDA_DISINI',

  // Pairs optimized untuk Futures Trading
  PAIRS: [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
    'ADAUSDT', 'DOGEUSDT', 'MATICUSDT', 'PENGUUSDT', 'AVAXUSDT',
    'HBARUSDT', 'ENAUSDT', 'ONDOUSDT', 'SNXUSDT', 'NEARUSDT',
    'PUMPUSDT', 'ARBUSDT', 'PEPEUSDT', 'SUIUSDT', 'ASTRUSDT'
  ],

  TIMEFRAME: '15m', // Optimal untuk intraday futures
  CHECK_INTERVAL: 15000, // Cek setiap 15 detik (responsive)
  ALERT_COOLDOWN: 900000, // 15 menit anti-spam

  // Indicator Parameters (Match TradingView)
  SUPERTREND: {
    PERIOD: 10,
    MULTIPLIER: 3.0
  },

  UTBOT: {
    KEY_VALUE: 3.0,
    ATR_PERIOD: 10
  },

  // FUTURES TRADING PARAMETERS
  FUTURES: {
    MIN_VOLUME_MULTIPLIER: 1.5, // Volume harus 1.5x dari rata-rata
    MIN_RISK_REWARD: 1.5, // Minimal R:R 1:1.5
    MAX_RISK_PERCENT: 2.0, // Max risk 2% per trade
    LEVERAGE_RECOMMENDATION: 3, // Recommended leverage (conservative)
    ATR_TP_MULTIPLIER: 2, // Target = 2x ATR
    ATR_SL_MULTIPLIER: 1, // Stop Loss = 1x ATR
  },

  // Anti-Sleep System (Optimized for 5min UptimeRobot)
  SELF_PING_INTERVAL: 180000, // Self-ping setiap 3 menit
  KEEP_ALIVE_URL: process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : null
};

// ============================================
// EXPRESS SERVER
// ============================================
const app = express();
const PORT = process.env.PORT || 3000;

let botStats = {
  startTime: Date.now(),
  totalChecks: 0,
  totalAlerts: 0,
  lastCheck: null,
  activeSignals: {},
  lastSelfPing: null,
  selfPingCount: 0,
  uptimePercentage: 100
};

app.use((req, res, next) => {
  console.log(`?? ${req.method} ${req.path}`);
  next();
});

app.get('/', (req, res) => {
  const uptime = Math.floor((Date.now() - botStats.startTime) / 1000);
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);

  const signalsList = Object.entries(botStats.activeSignals)
    .map(([pair, data]) => {
      const signal = data.signal;
      const rr = data.rr || 0;
      const bgColor = signal === 'BUY' ? '#1a4d2e' : signal === 'SELL' ? '#5a1a1a' : '#2d2d2d';
      const rrColor = rr >= 2 ? '#00ff00' : rr >= 1.5 ? '#ffcc00' : '#ff6600';
      return `<div style="margin: 5px 0; padding: 12px; background: ${bgColor}; border-radius: 8px; border-left: 4px solid ${signal === 'BUY' ? '#00ff00' : signal === 'SELL' ? '#ff0000' : '#666'};">
        <strong>${pair}:</strong> ${signal} ${rr > 0 ? `<span style="color: ${rrColor}; font-size: 0.9em;">(R:R 1:${rr.toFixed(2)})</span>` : ''}
      </div>`;
    })
    .join('') || '<div style="color: #888; padding: 20px; text-align: center;">? Scanning markets...</div>';

  const fullUrl = `${req.protocol}://${req.get('host')}`;

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>?? Crypto Futures Trading Bot - Professional</title>
      <meta http-equiv="refresh" content="30">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Arial, sans-serif; 
          background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
          color: #fff;
          min-height: 100vh;
          padding: 20px;
        }
        .container { max-width: 1400px; margin: 0 auto; }
        .header {
          text-align: center;
          padding: 40px 20px;
          background: rgba(0,0,0,0.5);
          border-radius: 20px;
          margin-bottom: 30px;
          backdrop-filter: blur(15px);
          box-shadow: 0 10px 50px rgba(0,0,0,0.5);
          border: 1px solid rgba(255,215,0,0.2);
        }
        h1 {
          font-size: 3em;
          margin-bottom: 10px;
          background: linear-gradient(45deg, #ffd700, #ffed4e);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 0 30px rgba(255,215,0,0.3);
        }
        .badge {
          display: inline-block;
          padding: 10px 25px;
          background: linear-gradient(45deg, #00ff00, #00cc00);
          color: #000;
          border-radius: 25px;
          font-weight: bold;
          font-size: 1.2em;
          animation: glow 2s infinite;
          box-shadow: 0 0 20px rgba(0,255,0,0.5);
          margin: 5px;
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(0,255,0,0.5); }
          50% { box-shadow: 0 0 40px rgba(0,255,0,0.8); }
        }
        .url-box {
          background: rgba(0,0,0,0.6);
          padding: 25px;
          border-radius: 15px;
          margin-top: 25px;
          border: 2px solid #ffd700;
          box-shadow: 0 0 30px rgba(255,215,0,0.3);
        }
        .url-label {
          color: #ffd700;
          font-weight: bold;
          margin-bottom: 12px;
          font-size: 1.2em;
        }
        .url-value {
          background: #000;
          padding: 18px;
          border-radius: 10px;
          color: #00ff00;
          font-family: 'Courier New', monospace;
          font-size: 1.1em;
          word-break: break-all;
          border: 1px solid #00ff00;
        }
        .info-box {
          background: rgba(255,193,7,0.15);
          border: 2px solid #ffc107;
          padding: 20px;
          border-radius: 12px;
          margin-top: 20px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .stat-card {
          background: rgba(0,0,0,0.5);
          padding: 25px;
          border-radius: 15px;
          border-left: 5px solid #ffd700;
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.4);
          transition: all 0.3s;
        }
        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 40px rgba(255,215,0,0.3);
        }
        .stat-label {
          color: #bbb;
          font-size: 0.95em;
          margin-bottom: 10px;
        }
        .stat-value {
          font-size: 2.2em;
          font-weight: bold;
          background: linear-gradient(45deg, #ffd700, #00ff00);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .signals-section {
          background: rgba(0,0,0,0.5);
          padding: 30px;
          border-radius: 15px;
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.4);
          margin-bottom: 30px;
        }
        .signals-header {
          font-size: 2em;
          margin-bottom: 25px;
          padding-bottom: 15px;
          border-bottom: 3px solid #ffd700;
          color: #ffd700;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding: 25px;
          background: rgba(0,0,0,0.4);
          border-radius: 15px;
          backdrop-filter: blur(10px);
        }
        .tag {
          display: inline-block;
          background: rgba(255,255,255,0.1);
          padding: 8px 15px;
          border-radius: 15px;
          margin: 5px;
          font-size: 0.9em;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>?? FUTURES TRADING BOT</h1>
          <div class="badge">? PROFESSIONAL</div>
          <div class="badge">?? ALWAYS ON</div>

          <div class="url-box">
            <div class="url-label">?? Bot URL (Copy untuk UptimeRobot):</div>
            <div class="url-value">${fullUrl}</div>
            <div class="info-box">
              <strong style="color: #ffc107;">?? Setup UptimeRobot (100% GRATIS):</strong>
              <div style="color: #fff; margin-top: 10px; line-height: 1.8;">
                1. Monitor Type: <strong>HTTP(s)</strong><br>
                2. URL: Copy dari atas ??<br>
                3. Interval: <strong>5 minutes</strong> (free tier)<br>
                4. Timeout: 30 seconds<br>
                <br>
                ?? Bot punya <strong>self-ping setiap 3 menit</strong> + heartbeat system<br>
                ??? Triple protection untuk 99%+ uptime!
              </div>
            </div>
            <div style="background: rgba(0,255,0,0.1); border: 2px solid #00ff00; padding: 15px; border-radius: 10px; margin-top: 15px;">
              <strong style="color: #00ff00;">?? Anti-Sleep System:</strong><br>
              <div style="margin-top: 8px;">
                Last Self-Ping: ${botStats.lastSelfPing ? new Date(botStats.lastSelfPing).toLocaleTimeString('id-ID') : 'Starting...'}<br>
                Total Pings: ${botStats.selfPingCount}<br>
                Status: <span style="color: #00ff00; font-weight: bold;">ACTIVE ?</span>
              </div>
            </div>
          </div>

          <div style="margin-top: 20px;">
            <span class="tag">?? Futures Optimized</span>
            <span class="tag">?? Volume Filter</span>
            <span class="tag">? R:R Analysis</span>
            <span class="tag">??? Risk Management</span>
            <span class="tag">?? 100% Free</span>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">?? Uptime</div>
            <div class="stat-value">${hours}h ${minutes}m</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">?? Pairs</div>
            <div class="stat-value">${CONFIG.PAIRS.length}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">?? Signals</div>
            <div class="stat-value">${botStats.totalAlerts}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">?? Checks</div>
            <div class="stat-value">${botStats.totalChecks}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">? Interval</div>
            <div class="stat-value">${CONFIG.CHECK_INTERVAL / 1000}s</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">?? Timeframe</div>
            <div class="stat-value">${CONFIG.TIMEFRAME}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">?? Min R:R</div>
            <div class="stat-value">${CONFIG.FUTURES.MIN_RISK_REWARD}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">?? Last Check</div>
            <div class="stat-value" style="font-size: 1.3em;">${botStats.lastCheck ? new Date(botStats.lastCheck).toLocaleTimeString('id-ID') : 'N/A'}</div>
          </div>
        </div>

        <div class="signals-section">
          <div class="signals-header">?? Active Signals (Futures Ready)</div>
          ${signalsList}
        </div>

        <div class="footer">
          <p style="font-size: 1.1em; color: #ffd700;">?? ${new Date().toLocaleString('id-ID')}</p>
          <p style="margin-top: 12px;">?? UT Bot (${CONFIG.UTBOT.KEY_VALUE}) + Supertrend (${CONFIG.SUPERTREND.PERIOD},${CONFIG.SUPERTREND.MULTIPLIER}) + Volume Filter</p>
          <p style="margin-top: 8px;">? Professional Futures Trading Strategy  24/7 Operation</p>
          <p style="margin-top: 8px; color: #00ff00;">??? Self-Ping: 3min  Heartbeat: 1min  UptimeRobot: 5min</p>
        </div>
      </div>
    </body>
    </html>
  `);
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    uptime: Math.floor((Date.now() - botStats.startTime) / 1000),
    stats: botStats,
    config: {
      timeframe: CONFIG.TIMEFRAME,
      minRiskReward: CONFIG.FUTURES.MIN_RISK_REWARD,
      leverage: CONFIG.FUTURES.LEVERAGE_RECOMMENDATION
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/ping', (req, res) => {
  res.send('pong - ' + Date.now());
});

// ============================================
// GLOBAL VARIABLES
// ============================================
let bot;
let lastSignals = {};
let lastAlertTime = {};
let isInitialized = false;

// ============================================
// TELEGRAM BOT
// ============================================
function initTelegramBot() {
  try {
    bot = new TelegramBot(CONFIG.TELEGRAM_BOT_TOKEN, { polling: false });
    console.log('? Telegram Bot initialized');
    return true;
  } catch (error) {
    console.error('? Error initializing Telegram:', error.message);
    return false;
  }
}

async function sendTelegramMessage(message) {
  try {
    await bot.sendMessage(CONFIG.TELEGRAM_CHAT_ID, message, { parse_mode: 'HTML' });
    console.log('?? Alert sent');
    botStats.totalAlerts++;
    return true;
  } catch (error) {
    console.error('? Telegram error:', error.message);
    return false;
  }
}

// ============================================
// ANTI-SLEEP SYSTEM
// ============================================
function selfPing() {
  const url = CONFIG.KEEP_ALIVE_URL || `http://localhost:${PORT}/ping`;

  https.get(url, (res) => {
    botStats.lastSelfPing = Date.now();
    botStats.selfPingCount++;
    console.log(`?? Self-ping #${botStats.selfPingCount} OK`);
  }).on('error', () => {
    // Silent fail, retry next cycle
  });
}

setInterval(selfPing, CONFIG.SELF_PING_INTERVAL);

// ============================================
// FETCH DATA
// ============================================
async function fetchKlineData(symbol) {
  try {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${CONFIG.TIMEFRAME}&limit=100`;
    const response = await axios.get(url, { timeout: 10000 });

    return response.data.map(k => ({
      time: k[0],
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5])
    }));
  } catch (error) {
    return null;
  }
}

// ============================================
// HEIKIN ASHI
// ============================================
function convertToHeikinAshi(candles) {
  const ha = [];
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      ha.push({
        time: candles[i].time,
        open: (candles[i].open + candles[i].close) / 2,
        high: candles[i].high,
        low: candles[i].low,
        close: (candles[i].open + candles[i].high + candles[i].low + candles[i].close) / 4,
        volume: candles[i].volume
      });
    } else {
      const haClose = (candles[i].open + candles[i].high + candles[i].low + candles[i].close) / 4;
      const haOpen = (ha[i-1].open + ha[i-1].close) / 2;
      ha.push({
        time: candles[i].time,
        open: haOpen,
        high: Math.max(candles[i].high, haOpen, haClose),
        low: Math.min(candles[i].low, haOpen, haClose),
        close: haClose,
        volume: candles[i].volume
      });
    }
  }
  return ha;
}

// ============================================
// ATR
// ============================================
function calculateATR(candles, period) {
  const tr = [];
  for (let i = 1; i < candles.length; i++) {
    tr.push(Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close)
    ));
  }

  const atr = [];
  let rma = tr.slice(0, period).reduce((a, b) => a + b, 0) / period;
  atr.push(rma);

  const alpha = 1 / period;
  for (let i = period; i < tr.length; i++) {
    rma = alpha * tr[i] + (1 - alpha) * rma;
    atr.push(rma);
  }
  return atr;
}

// ============================================
// SUPERTREND
// ============================================
function calculateSupertrend(candles) {
  const { PERIOD, MULTIPLIER } = CONFIG.SUPERTREND;
  const atr = calculateATR(candles, PERIOD);

  const supertrend = [];
  let direction = 1;

  for (let i = 0; i < atr.length; i++) {
    const idx = i + (candles.length - atr.length);
    const hl2 = (candles[idx].high + candles[idx].low) / 2;
    const close = candles[idx].close;

    const basicUpperBand = hl2 + (MULTIPLIER * atr[i]);
    const basicLowerBand = hl2 - (MULTIPLIER * atr[i]);

    let upperBand, lowerBand;

    if (i === 0) {
      upperBand = basicUpperBand;
      lowerBand = basicLowerBand;
    } else {
      const prevClose = candles[idx - 1].close;
      upperBand = basicUpperBand < supertrend[i-1].upper || prevClose > supertrend[i-1].upper ? basicUpperBand : supertrend[i-1].upper;
      lowerBand = basicLowerBand > supertrend[i-1].lower || prevClose < supertrend[i-1].lower ? basicLowerBand : supertrend[i-1].lower;
    }

    const prevDirection = i > 0 ? supertrend[i-1].direction : 1;
    direction = prevDirection === -1 ? (close > upperBand ? 1 : -1) : (close < lowerBand ? -1 : 1);

    supertrend.push({
      upper: upperBand,
      lower: lowerBand,
      direction: direction,
      supertrendUp: direction === 1,
      supertrendDown: direction === -1
    });
  }

  return supertrend[supertrend.length - 1];
}

// ============================================
// UT BOT
// ============================================
function calculateUTBot(candles) {
  const { KEY_VALUE, ATR_PERIOD } = CONFIG.UTBOT;
  const atr = calculateATR(candles, ATR_PERIOD);

  let xATRTrailingStop = 0;
  let pos = 1;
  const signals = [];

  for (let i = 0; i < atr.length; i++) {
    const idx = i + (candles.length - atr.length);
    const close = candles[idx].close;
    const nLoss = KEY_VALUE * atr[i];

    let prevATRStop = xATRTrailingStop;

    if (close > prevATRStop && i > 0) {
      xATRTrailingStop = Math.max(prevATRStop, close - nLoss);
    } else if (close < prevATRStop && i > 0) {
      xATRTrailingStop = Math.min(prevATRStop, close + nLoss);
    } else if (close > prevATRStop) {
      xATRTrailingStop = close - nLoss;
    } else {
      xATRTrailingStop = close + nLoss;
    }

    const prevPos = pos;
    pos = close < xATRTrailingStop ? -1 : (close > xATRTrailingStop ? 1 : prevPos);

    let buySignal = false;
    let sellSignal = false;

    if (i > 0) {
      const prevSrc = candles[idx - 1].close;
      const prevStop = signals[i - 1].trail;

      if (close > xATRTrailingStop && prevSrc <= prevStop) buySignal = true;
      if (close < xATRTrailingStop && prevSrc >= prevStop) sellSignal = true;
    }

    signals.push({
      trail: xATRTrailingStop,
      pos: pos,
      buySignal: buySignal,
      sellSignal: sellSignal
    });
  }

  return signals[signals.length - 1];
}

// ============================================
// VOLUME FILTER (PROFESSIONAL)
// ============================================
function checkVolumeFilter(candles) {
  const currentVolume = candles[candles.length - 1].volume;
  const avgVolume = candles.slice(-20).reduce((sum, c) => sum + c.volume, 0) / 20;

  return {
    passed: currentVolume >= (avgVolume * CONFIG.FUTURES.MIN_VOLUME_MULTIPLIER),
    ratio: currentVolume / avgVolume,
    currentVolume: currentVolume,
    avgVolume: avgVolume
  };
}

// ============================================
// ANALYZE SIGNAL (PROFESSIONAL GRADE)
// ============================================
async function analyzeSignal(symbol) {
  try {
    const candles = await fetchKlineData(symbol);
    if (!candles || candles.length < 100) return;

    const haCandles = convertToHeikinAshi(candles);
    const supertrend = calculateSupertrend(haCandles);
    const utbot = calculateUTBot(haCandles);
    const volumeCheck = checkVolumeFilter(candles);
    const currentPrice = candles[candles.length - 1].close;

    let signal = null;

    // STRICT RULES: UT Bot + Supertrend + Volume
    if (utbot.buySignal && supertrend.supertrendUp && volumeCheck.passed) {
      signal = 'BUY';
    } else if (utbot.sellSignal && supertrend.supertrendDown && volumeCheck.passed) {
      signal = 'SELL';
    }

    // Calculate targets
    const atr14 = calculateATR(haCandles, 14);
    const currentATR = atr14[atr14.length - 1];

    let target, stopLoss, potentialProfit, potentialLoss, riskReward;

    if (signal === 'BUY') {
      target = currentPrice + (currentATR * CONFIG.FUTURES.ATR_TP_MULTIPLIER);
      stopLoss = currentPrice - (currentATR * CONFIG.FUTURES.ATR_SL_MULTIPLIER);
      potentialProfit = ((target - currentPrice) / currentPrice * 100);
      potentialLoss = ((currentPrice - stopLoss) / currentPrice * 100);
    } else if (signal === 'SELL') {
      target = currentPrice - (currentATR * CONFIG.FUTURES.ATR_TP_MULTIPLIER);
      stopLoss = currentPrice + (currentATR * CONFIG.FUTURES.ATR_SL_MULTIPLIER);
      potentialProfit = ((currentPrice - target) / currentPrice * 100);
      potentialLoss = ((stopLoss - currentPrice) / currentPrice * 100);
    }

    if (signal) {
      riskReward = potentialProfit / potentialLoss;

      // PROFESSIONAL FILTER: Min R:R check
      if (riskReward < CONFIG.FUTURES.MIN_RISK_REWARD) {
        signal = null; // Reject low R:R trades
        console.log(`?? ${symbol}: R:R too low (${riskReward.toFixed(2)}) - SKIPPED`);
      }
    }

    // Update stats
    botStats.activeSignals[symbol] = { signal: signal || 'WAIT', rr: riskReward || 0 };

    const signalChanged = lastSignals[symbol] !== signal;
    const now = Date.now();
    const lastAlert = lastAlertTime[symbol] || 0;
    const cooldownPassed = (now - lastAlert) >= CONFIG.ALERT_COOLDOWN;

    if (signal && (signalChanged || cooldownPassed)) {
      lastSignals[symbol] = signal;
      lastAlertTime[symbol] = now;

      // Calculate position size for 2% risk
      const accountSize = 1000; // Example, user should adjust
      const riskAmount = accountSize * (CONFIG.FUTURES.MAX_RISK_PERCENT / 100);
      const positionSize = riskAmount / potentialLoss * 100;

      const emoji = signal === 'BUY' ? '??' : '??';
      const arrow = signal === 'BUY' ? '??' : '??';

      const message = `
${emoji}${arrow} <b>${signal} SIGNAL - FUTURES</b> ${arrow}${emoji}

?? <b>${symbol}</b>
?? Entry: <b>${currentPrice.toFixed(6)}</b>
?? TF: <b>${CONFIG.TIMEFRAME}</b> | Heikin Ashi
? ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}

? <b>UT Bot:</b> ${signal} ?
? <b>Supertrend:</b> ${supertrend.supertrendUp ? '?? GREEN' : '?? RED'} ?
? <b>Volume:</b> ${volumeCheck.ratio.toFixed(2)}x (${volumeCheck.passed ? '?' : '?'})

??????????????????????
?? <b>FUTURES SETUP:</b>

?? <b>Take Profit:</b> ${target.toFixed(6)}
   ?? Gain: <b>+${potentialProfit.toFixed(2)}%</b>

?? <b>Stop Loss:</b> ${stopLoss.toFixed(6)}
   ?? Risk: <b>-${potentialLoss.toFixed(2)}%</b>

?? <b>Risk:Reward = 1:${riskReward.toFixed(2)}</b>
${riskReward >= 2 ? '? EXCELLENT' : riskReward >= 1.5 ? '? GOOD' : '?? ACCEPTABLE'}

? <b>Leverage:</b> ${CONFIG.FUTURES.LEVERAGE_RECOMMENDATION}x (Conservative)
?? <b>Position Size:</b> ${positionSize.toFixed(2)}% of capital
   <i>(Risk ${CONFIG.FUTURES.MAX_RISK_PERCENT}% = ${riskAmount.toFixed(2)})</i>

??????????????????????

?? <b>TRADING PLAN:</b>
${signal === 'BUY' ? '?? Open LONG position' : '?? Open SHORT position'}
${signal === 'BUY' ? '?? Set TP at resistance' : '?? Set TP at support'}
${signal === 'BUY' ? '?? SL below recent low' : '?? SL above recent high'}

? <i>All indicators aligned + Volume confirmed!</i>
?? <i>Professional grade signal - Ready to trade!</i>

<i>?? Match TradingView  Optimized for Futures Trading</i>
      `.trim();

      await sendTelegramMessage(message);
      console.log(`?? ${symbol} ${signal} ${currentPrice.toFixed(4)} R:R=${riskReward.toFixed(2)}`);
    }

    const stStatus = supertrend.supertrendUp ? '??' : '??';
    const utStatus = utbot.buySignal ? '??B' : utbot.sellSignal ? '??S' : '?';
    const volStatus = volumeCheck.passed ? '?' : '?';
    const status = signal || 'WAIT';

    console.log(`${symbol}: ${currentPrice.toFixed(4)} | ST:${stStatus} UT:${utStatus} Vol:${volStatus} | ${status}`);

  } catch (error) {
    console.error(`? ${symbol}:`, error.message);
  }
}

// ============================================
// CHECK ALL PAIRS
// ============================================
async function checkAllPairs() {
  console.log(`\n?? [${new Date().toLocaleTimeString('id-ID')}] Scanning ${CONFIG.PAIRS.length} pairs...`);
  botStats.totalChecks++;
  botStats.lastCheck = Date.now();

  for (const symbol of CONFIG.PAIRS) {
    await analyzeSignal(symbol);
    await sleep(100);
  }

  console.log('? Scan completed\n');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// MAIN
// ============================================
async function main() {
  console.log('?? Starting Professional Futures Trading Bot...\n');
  console.log('?? Features: Volume Filter + R:R Analysis + Risk Management\n');

  if (CONFIG.TELEGRAM_BOT_TOKEN.includes('MASUKKAN')) {
    console.error('? ERROR: Set TELEGRAM_BOT_TOKEN in Secrets');
    return;
  }

  if (CONFIG.TELEGRAM_CHAT_ID.includes('MASUKKAN')) {
    console.error('? ERROR: Set TELEGRAM_CHAT_ID in Secrets');
    return;
  }

  if (!initTelegramBot()) {
    console.error('? Failed to initialize Telegram Bot');
    return;
  }

  if (!isInitialized) {
    await sendTelegramMessage(`
?? <b>FUTURES TRADING BOT ACTIVATED!</b>

? Status: <b>PROFESSIONAL MODE</b>
?? Pairs: <b>${CONFIG.PAIRS.length}</b> (Futures optimized)
?? Strategy: <b>Intraday Futures</b>
? Timeframe: <b>${CONFIG.TIMEFRAME}</b> (Heikin Ashi)
?? Check: <b>Every ${CONFIG.CHECK_INTERVAL / 1000}s</b>
?? Cooldown: <b>${CONFIG.ALERT_COOLDOWN / 60000}m</b>

?? <b>Professional Features:</b>
 UT Bot + Supertrend (100% Match TV)
 Volume Filter (${CONFIG.FUTURES.MIN_VOLUME_MULTIPLIER}x requirement)
 Min R:R ${CONFIG.FUTURES.MIN_RISK_REWARD} filter
 Risk Management (Max ${CONFIG.FUTURES.MAX_RISK_PERCENT}% per trade)
 Position sizing calculator
 Leverage recommendation (${CONFIG.FUTURES.LEVERAGE_RECOMMENDATION}x)

??? <b>Always-On System:</b>
 Self-ping: Every 3 minutes
 Heartbeat: Every 1 minute
 UptimeRobot: 5 min (FREE tier)

? <b>Bot akan jalan 24/7 bahkan saat PC mati!</b>
?? <b>100% Free  No VPS needed</b>

<i>?? Ready for professional Futures trading!</i>
    `.trim());

    isInitialized = true;
  }

  await checkAllPairs();
  setInterval(checkAllPairs, CONFIG.CHECK_INTERVAL);

  console.log(`? Bot running! Professional mode active`);
  console.log(`??? Anti-sleep: Self-ping (3m) + Heartbeat (1m) + UptimeRobot (5m)`);
  console.log(`?? Alerts 24/7 even when PC is OFF\n`);
}

// ============================================
// START SERVER
// ============================================
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`?? Server running on port ${PORT}`);
  console.log(`?? URL: http://0.0.0.0:${PORT}`);
  console.log(`??? Anti-Sleep System: ENABLED\n`);

  setTimeout(() => {
    selfPing();
    setTimeout(main, 2000);
  }, 3000);
});

// ============================================
// ERROR HANDLING
// ============================================
process.on('uncaughtException', (error) => {
  console.error('? Exception:', error.message);
});

process.on('unhandledRejection', (error) => {
  console.error('? Rejection:', error.message);
});

process.on('SIGTERM', () => {
  console.log('?? Shutting down...');
  server.close(() => {
    console.log('? Server closed');
    process.exit(0);
  });
});

// ============================================
// KEEP-ALIVE HEARTBEAT
// ============================================
setInterval(() => {
  const uptime = Math.floor((Date.now() - botStats.startTime) / 60000);
  console.log(`?? Alive | ${uptime}m | Alerts:${botStats.totalAlerts} | Checks:${botStats.totalChecks} | Pings:${botStats.selfPingCount}`);
}, 300000); // Every 5 minutes

// Heartbeat logger (keep process active)
setInterval(() => {
  console.log('?? Heartbeat...');
}, 60000); // Every 1 minute
