interface passiveType{
    "name": string
    "description": string
    "image":  imageType
}

interface levelTipType{
    "label": string[]
    "effect": string[]   
}

interface spellType{
    "id": string
    "name": string
    "description": string
    "tooltip": string
    "leveltip": levelTipType
    "maxrank": number
    "cooldown": number[]
    "cooldownBurn": string
    "cost": number[]
    "costBurn": string
    // // "datavalues:"
    "effect": (null|number[])[]
    "effectBurn": (null|string)[]
    // // "vars":
    "costType": string
    "maxammo": string
    "range": number[]
    "image": imageType
    "resource": string
}

interface statsType{
    "hp": number
    "hpperlevel": number
    "mp": number
    "mpperlevel": number
    "movespeed": number
    "armor": number
    "armorperlevel": number
    "spellblock": number
    "spellblockperlevel": number
    "attackrange": number
    "hpregen": number
    "hpregenperlevel": number
    "mpregen": number
    "mpregenperlevel": number
    "crit": number
    "critperlevel": number
    "attackdamage": number
    "attackdamageperlevel": number
    "attackspeedperlevel": number
    "attackspeed": number
}

interface infoType{
    "attack": number
    "defense": number
    "magic": number
    "difficulty": number
}

interface skinType{
    "id": string
    "num": number
    "name": string
    "chromas": boolean
}

interface imageType{
    "full": string
    "sprite": string
    "group": string
    "x": number
    "y": number
    "w": number
    "h": number
}

export interface ChampType{
    "id": string
    "key": string
    "name": string
    "image": imageType
    "skins": skinType[]
    "lore": string
    "blurb": string
    "allytips": string[]
    "enemytips": string[]
    "tags": string[]
    "partype": string
    "info": infoType
    "stats": statsType
    "spells": spellType[]
    "passive": passiveType
    // "recomended":
}