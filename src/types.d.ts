interface JPXSPlayerSearchResponse {
    success: boolean;
    requestTime: number;
    searchMode: string;
    players: Player[];
}

interface Player {
    name: string;
    avatar: Avatar;
    description: string;
    gameId: number;
    phoneNumber: number;
    discordId: string;
    steamId: string;
    firstSeen: string;
    lastSeen: string;
    nameHistory: NameHistory[];
    avatarHistory: AvatarHistory[];
}

interface AvatarHistory {
    id: string;
    avatar: Avatar2;
    date: string;
    url: string;
}

interface Avatar2 {
    id: string;
    sex: number;
    head: number;
    eyes: number;
    hair: number;
    hairColor: number;
    skin: number;
}

interface NameHistory {
    id: string;
    date: string;
    name: string;
}

interface Avatar {
    id: string;
}