"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const discord_js_1 = require("discord.js");
const cheerio_1 = __importDefault(require("cheerio"));
const node_cron_1 = __importDefault(require("node-cron"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const config_json_1 = require("./config.json");
const webhookClient = new discord_js_1.WebhookClient({ url: config_json_1.webhook_url });
// Function to scrape a website
async function scrapeWebsite() {
    try {
        const response = await axios_1.default.get('https://www.hamik.cz/archive/', {
            timeout: 10000,
        });
        const $ = cheerio_1.default.load(response.data);
        let Episodes = [];
        const targetDiv = $('div.row.row-cols-md-3.row-cols-lg-5.justify-content-center');
        targetDiv.children().each((index, element) => {
            Episodes.push(String($(element).children().attr('href')));
            console.log("elm", String($(element).children().attr('href')));
        });
        return Episodes;
    }
    catch (error) {
        console.log(error);
        return null;
    }
}
async function ReadFile(url) {
    try {
        const response = await axios_1.default.get(url, { responseType: 'arraybuffer' });
        const data = await (0, pdf_parse_1.default)(response.data);
        const marker = "_____________________________________________________________________________________________________________________________________________________________________________";
        const MarkerIndex = data.text.indexOf(marker) + 624;
        if (MarkerIndex !== -1) {
            const textAfterMarker = data.text.substring(MarkerIndex + marker.length);
            const PreviewText = textAfterMarker.substring(0, 150);
            return PreviewText;
        }
        else
            return null;
    }
    catch (error) {
        return null;
    }
}
async function Process() {
    const Episodes = await scrapeWebsite();
    if (Episodes === null)
        return console.log('Error: Failed to scrape website');
    const Preview = await ReadFile(`https://www.hamik.cz${Episodes[0]}`);
    if (Preview === null)
        return console.log('Error: Failed to read file');
    await webhookClient.send({
        content: '',
        username: 'Nový díl Hamíkova Koutku!',
        embeds: [
            {
                title: `Hamíkův Koutek ep. ${Episodes[0].match(/\d+/g)[0]}`,
                description: `${Preview}........ \n\n> ***Pro přečtení klikni na modrý nadpis.***`,
                url: `https://www.hamik.cz${Episodes[0]}`,
                color: 1891805,
                footer: {
                    text: 'Webhook vytvořil depstr • Zdroj dat: https://www.hamik.cz/archive/',
                },
            },
        ],
    });
}
async function Run() {
    console.log('Running');
    await Process();
    node_cron_1.default.schedule('0 10 * * 6', async () => {
        console.log("Scheduling CRON");
        const randomDelay = Math.floor(Math.random() * 240);
        setTimeout(async () => {
            console.log('Running CRON');
            await Process();
        }, randomDelay * 60000);
    });
}
Run();
