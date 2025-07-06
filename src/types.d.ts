export interface JPXSPlayerSearchResponse {
    name: string;
    phoneNumber: number;
    gameId: number;
    steamId: null;
    discordId: null;
    firstSeen: string;
    lastSeen: string;
    avatar: Avatar;
    status: Status;
}

interface Status {
    online: boolean;
    server: Server;
    startedAt: string;
    endedAt: string;
}

interface Server {
    id: string;
    address: string;
    port: number;
    identifier: number;
    description: string;
    icon: string;
    tags: string[];
    link: string;
    bans: any[];
    createdAt: string;
    updatedAt: string;
}

interface Avatar {
    id: string;
    gender: number;
    skinColor: number;
    hairColor: number;
    hair: number;
    eyeColor: number;
    head: number;
}
