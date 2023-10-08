import axios from 'axios';
import { WebhookClient } from 'discord.js';
import cheerio from 'cheerio';
import cron from 'node-cron';
import pdf from 'pdf-parse';
import { webhook_url } from './config.json';

const webhookClient = new WebhookClient({ url: webhook_url });

// Function to scrape a website
async function scrapeWebsite() {
  try {
    const response = await axios.get('https://www.hamik.cz/archive/');
    const $ = cheerio.load(response.data);
    let Episodes: Array<string> = [];
    const targetDiv = $('div.row.row-cols-md-3.row-cols-lg-5.justify-content-center');

    targetDiv.children().each((index, element) => {
      Episodes.push(String($(element).children().attr('href')))
    });
    return Episodes;
    
  } catch (error) {
    return null;
  }
}

async function ReadFile(url: string) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const data = await pdf(response.data);
    const marker = "_____________________________________________________________________________________________________________________________________________________________________________";
    const MarkerIndex = data.text.indexOf(marker)+624;


    if (MarkerIndex !== -1) {
      const textAfterMarker = data.text.substring(MarkerIndex + marker.length);
      const PreviewText = textAfterMarker.substring(0, 150);

      return PreviewText;
    } else return null;
  } catch (error) {
    return null;
  }
}

async function Process() {
  const Episodes: Array<string> | null = await scrapeWebsite();
  if (Episodes === null) return console.log('Error: Failed to scrape website');

  const Preview = await ReadFile(`https://www.hamik.cz${Episodes[0]}`);
  if (Preview === null) return console.log('Error: Failed to read file');

  await webhookClient.send({
    content: '',
    username: 'Nový díl Hamíkova Koutku!',
    embeds: [
      {
        title: `Hamíkův Koutek ep. ${Episodes[0].match(/\d+/g)![0]}`,
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
  cron.schedule('0 10 * * 6', async () => {
    console.log('Running CRON');
    await Process();
  });
}
Run();