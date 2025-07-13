require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
const FOOTBALL_API_URL = "https://v3.football.api-sports.io";

// 🔁 Commande de démarrage
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Bienvenue 👋 ! Tape /live ou /prochains pour les matchs.");
});

// ⚽ Live match
bot.onText(/\/live/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const res = await axios.get(`${FOOTBALL_API_URL}/fixtures`, {
      headers: { "x-apisports-key": process.env.FOOTBALL_API_KEY },
      params: { live: "all" },
    });

    if (res.data.response.length === 0) {
      bot.sendMessage(chatId, "Aucun match en direct actuellement.");
      return;
    }

    for (let match of res.data.response.slice(0, 5)) {
      const home = match.teams.home;
      const away = match.teams.away;
      const score = match.goals;

      bot.sendPhoto(chatId, home.logo, { caption: `${home.name} vs ${away.name}` });
      bot.sendPhoto(chatId, away.logo, {
        caption: `⏱ ${match.fixture.status.elapsed}'\n🧠 Score: ${score.home} - ${score.away}`,
      });
    }
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "Erreur lors de la récupération des matchs.");
  }
});

// 📅 Matchs à venir
bot.onText(/\/prochains/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const res = await axios.get(`${FOOTBALL_API_URL}/fixtures`, {
      headers: { "x-apisports-key": process.env.FOOTBALL_API_KEY },
      params: { next: 5 },
    });

    for (let match of res.data.response) {
      const home = match.teams.home;
      const away = match.teams.away;
      const date = new Date(match.fixture.date).toLocaleString();

      bot.sendPhoto(chatId, home.logo, { caption: `${home.name} vs ${away.name}` });
      bot.sendPhoto(chatId, away.logo, {
        caption: `📅 Date: ${date}`,
      });
    }
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "Erreur lors de la récupération.");
  }
});

// 🎯 Pronostics
bot.onText(/\/pronos/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const res = await axios.get(`${FOOTBALL_API_URL}/predictions`, {
      headers: { "x-apisports-key": process.env.FOOTBALL_API_KEY },
      params: { fixture: 198772 }, // à personnaliser dynamiquement
    });

    const prediction = res.data.response[0];
    const home = prediction.teams.home.name;
    const away = prediction.teams.away.name;
    const winner = prediction.predictions.winner.name;
    const percent = prediction.predictions.winner.percent;

    bot.sendMessage(chatId, `🔮 ${home} vs ${away}\nGagnant probable : ${winner} (${percent}%)`);
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "Pronostic non disponible.");
  }
});
