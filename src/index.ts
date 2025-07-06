import express from 'express';
import puppeteer, { Browser, Page } from "puppeteer";
import path from "path";
import { JPXSPlayerSearchResponse } from './types';

const port = 3022

const app = express();

const cache = new Map<string, {
    data: Buffer,
    time: number,
    size: number
}>();

class Puppeteer {

    public browser!: Browser;
    public page!: Page

    public async init() {
        this.browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
            ],
            defaultViewport: {
                width: 256,
                height: 256,
            },
        });
        // this.page = await this.browser.pages().then(pages => pages[0]);
        // await this.page.goto(`http://127.0.0.1:${port}/internal/avatar/avatar.html`)

        this.browser.on("disconnected", () => {
            this.init();
        })
    }

    public async getAvatarScreenshot(opt: {
        gender: "m" | "f",
        team: "gdm" | "mon" | "oxs" | "nex" | "ptc" | "meg",
        head: number,
        eyeColor: number,
        hairColor: number,
        skinColor: number,
        hair: number,
        size?: number,
        silly?: boolean
    }) {

        const page = await this.browser.newPage()
        await page.goto(`http://127.0.0.1:${port}/internal/avatar/avatar.html`)

        await page.evaluate(`
               function run() {
                ${Object.keys(opt).map(key => `rosa.${key} = "${(opt as any)[key]}"`).join(";")};
                rosa.redraw();
                ${opt.silly ? " camera.position.set(0, 0.4, 1.6);camera.rotation.set(-0.7, 0, 0);camera.fov = 120;" : ""}

                console.log("rosaLoaded");
                }

             const interval = setInterval(() => {
                if (typeof rosa !== "undefined") {
                    run();
                    clearInterval(interval);
                }
            }, 100);
            `)



        await new Promise<void>((resolve) => {
            page.on("console", (msg) => {
                if (msg.text() === "rosaLoaded") {
                    console.log(`Rosa loaded, resolving promise`)
                    resolve();
                }
            });
        });

        const canvasElement = await page.$("canvas");
        if (!canvasElement) throw new Error("Canvas element not found");

        console.log(`Canvas element found, preparing to take screenshot`)

        // set viewport size
        if (opt.size) {
            await page.setViewport({
                width: opt.size,
                height: opt.size
            })
        }

        console.log(`Taking screenshot for avatar with options: ${JSON.stringify(opt)}`)

        const screenshot = await canvasElement.screenshot({
            omitBackground: true,
            fromSurface: true,
            type: "png",
            clip: {
                x: 0,
                y: 0,
                width: opt.size || 256,
                height: opt.size || 256
            }
        })

        await page.close();

        return screenshot
    }

}

app.get("/cache", (req, res) => {
    res.json({
        size: cache.size,
        cache: Array.from(cache.entries()).map(([key, value]) => ({
            key,
            size: value.size,
            time: value.time,
            age: Date.now() - value.time
        }))
    })
})

const puppet = new Puppeteer();

app.get('/:i', async (req, res) => {

    const { i } = req.params;

    if (!i) return res.status(400).json({ error: "Missing param" })


    let size = 256;
    let silly = false;

    if (req.query.size) {
        size = parseInt(req.query.size as string);

        if (isNaN(size) || size < 16 || size > 1024) return res.status(400).json({ error: "Invalid size" })
    }

    if (req.query.silly) {
        silly = true;
    }


    const playerDataRes = await fetch(`https://beta.jpxs.io/api/player/${i}`)
    const playerData = await playerDataRes.json() as JPXSPlayerSearchResponse[]

    const player = playerData[0]

    if (!player) return res.status(404).json({ error: "Player not found" })

    const avatar = player.avatar

    if (cache.has(avatar.id)) {
        const cached = cache.get(avatar.id);

        if (cached && cached.size === size) {

            console.log(`Getting avatar for ${avatar.id} with size ${size} - using cache`)

            res.type("png");
            res.send(cached.data);
            return;
        }
    }


    console.log(`Getting avatar for ${avatar.id} with size ${size} - got id ${avatar.id}`)

    const img = await puppet.getAvatarScreenshot({
        team: "meg",
        head: avatar.head + 1,
        eyeColor: avatar.eyeColor + 1,
        hairColor: avatar.hairColor + 1,
        skinColor: avatar.skinColor + 1,
        gender: avatar.gender == 1 ? "m" : "f",
        hair: avatar.hair + 1,
        size,
        silly
    })

    cache.set(avatar.id, {
        data: img,
        time: Date.now(),
        size
    })

    res.type("png");
    res.send(img);
})

app.use("/internal/avatar", express.static(path.resolve("./src/assets")));

app.listen(port, async () => {
    await puppet.init();
    console.log(`Server running on port ${port}`);
})

setInterval(() => {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
        if (now - value.time > 1000 * 60 * 60) {
            cache.delete(key);
        }
    }
}, 1000 * 60 * 60)