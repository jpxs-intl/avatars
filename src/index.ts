import express from 'express';
import puppeteer, { Browser, Page } from "puppeteer";
import path from "path";

const port = 3022

const app = express();

const cache = new Map<number, {
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
            }
        });
        this.page = await this.browser.pages().then(pages => pages[0]);
        await this.page.goto(`http://127.0.0.1:${port}/internal/avatar/avatar.html`)

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
        await this.runJs(`${Object.keys(opt).map(key => `rosa.${key} = "${(opt as any)[key]}"`).join(";")};rosa.redraw();${opt.silly ? " camera.position.set(0, 0.4, 1.6);camera.rotation.set(-0.7, 0, 0);camera.fov = 120;" : ""}`)
        const canvasElement = await this.page.$("canvas");
        if (!canvasElement) throw new Error("Canvas element not found");

        // set viewport size
        if (opt.size) {
            await this.page.setViewport({
                width: opt.size,
                height: opt.size
            })
        }

        return await canvasElement.screenshot({
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
    }

    private async runJs(js: string) {
        return await this.page.evaluate(js);
    }

}

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


    const playerDataRes = await fetch(`https://jpxs.io/api/player/${i}`)
    const playerData = await playerDataRes.json() as JPXSPlayerSearchResponse

    if (!playerData.success) return res.status(400).json({ error: "Request failed." })

    const player = playerData.players.sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())[0];

    if (cache.has(player.phoneNumber)) {
        const cached = cache.get(playerData.players[0].phoneNumber);

        if (cached && cached.size === size) {

            console.log(`Getting avatar for ${player.phoneNumber} with size ${size} - using cache`)

            res.type("png");
            res.send(cached.data);
            return;
        }
    }

    const avatar = player.avatarHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].avatar;

    console.log(`Getting avatar for ${player.phoneNumber} with size ${size} - got id ${avatar.id}`)

    const img = await puppet.getAvatarScreenshot({
        team: "meg",
        head: avatar.head + 1,
        eyeColor: avatar.eyes + 1,
        hairColor: avatar.hairColor + 1,
        skinColor: avatar.skin + 1,
        gender: avatar.sex == 1 ? "m" : "f",
        hair: avatar.hair + 1,
        size,
        silly
    })

    cache.set(playerData.players[0].phoneNumber, {
        data: img,
        time: Date.now(),
        size: size
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