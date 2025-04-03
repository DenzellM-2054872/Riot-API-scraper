import axios from 'axios'
import rateLimit from 'axios-rate-limit';
import fs from 'fs';
import {sortW, cleanW, rankedSortW, rankedCleanW} from './sort-clean';
import moment from 'moment';

export default async function getUp(arg: string, opt: Array<string>){
    let yesterday: number = moment().subtract(24, 'hours').unix()
    const riotToken = fs.readFileSync(opt['token'],'utf8');
    const major_inst = rateLimit(rateLimit(axios.create(), {maxRPS: 20}), {maxRequests: 100, perMilliseconds:120000});
    const minor_inst = rateLimit(rateLimit(axios.create(), {maxRPS: 15}), {maxRequests: 90, perMilliseconds:120000});

    major_inst.defaults.headers.common['X-Riot-Token'] = riotToken;
    minor_inst.defaults.headers.common['X-Riot-Token'] = riotToken;
    

    let region: string = arg;
    let dir: string = opt['dir'];
    let patch: string = opt['patch'];

    switch (region) {
        case "EUW1":
            major_inst.defaults.baseURL = 'https://europe.api.riotgames.com';
            break;
        case "EUN1":
            major_inst.defaults.baseURL = 'https://europe.api.riotgames.com';
            break;
        case "RU":
            major_inst.defaults.baseURL = 'https://europe.api.riotgames.com';
            break;
        case "TR1":
            major_inst.defaults.baseURL = 'https://europe.api.riotgames.com';
            break;
        case "ME1":
            major_inst.defaults.baseURL = 'https://europe.api.riotgames.com';
            break;

        case "OC1":
            major_inst.defaults.baseURL = 'https://sea.api.riotgames.com';
            break
        case "SG2":
            major_inst.defaults.baseURL = 'https://sea.api.riotgames.com';
            break
        case "TW2":
            major_inst.defaults.baseURL = 'https://sea.api.riotgames.com';
            break
        case "VN2":
            major_inst.defaults.baseURL = 'https://sea.api.riotgames.com';
            break

        case "NA1":
            major_inst.defaults.baseURL = 'https://americas.api.riotgames.com';
            break
        case "BR1":
            major_inst.defaults.baseURL = 'https://americas.api.riotgames.com';
            break
        case "LA1":
            major_inst.defaults.baseURL = 'https://americas.api.riotgames.com';
            break
        case "LA2":
            major_inst.defaults.baseURL = 'https://americas.api.riotgames.com';
            break

        case "KR":
            major_inst.defaults.baseURL = 'https://asia.api.riotgames.com';
            break
        case "JP1":
            major_inst.defaults.baseURL = 'https://asia.api.riotgames.com';
            break

        default:
            console.log("region not recognised");
            return;
    }
    minor_inst.defaults.baseURL = `https://${region.toLowerCase()}.api.riotgames.com`;

    if(!fs.existsSync(`${dir}/${patch}`)){
        fs.mkdirSync(`${dir}/${patch}`)
    }

    if(!fs.existsSync(`${dir}/${patch}/${region}`)){
        fs.mkdirSync(`${dir}/${patch}/${region}`)
    }

    let ID = Number(opt['id']);
    let content = fs.readdirSync(`${dir}/${patch}/${region}/`, { withFileTypes: true })
    let files = content.filter(dirent => dirent.isFile());
    const dirs = content.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);

    for(let directory of dirs){
        content = fs.readdirSync(`${dir}/${patch}/${region}/${directory}/`, { withFileTypes: true })
        files = files.concat(content.filter(dirent => dirent.isFile()))
    }

    let count = 0
    for(let file of content){
        let data = JSON.parse(fs.readFileSync(`${file.parentPath}/${file.name}`, {encoding: "utf-8"}))
        if(data["info"]["queueId"] == 400 || data["info"]["queueId"] == 420 || data["info"]["queueId"] == 440 || data["info"]["queueId"] == 490) count++;
    }

    if(!ID){
        content.sort(((a, b) => {
            if(a.name > b.name) return 1
            if(a.name < b.name) return -1
            return 0
        }));
        ID = Number(content[content.length - 1].name.replace(`overview_${region}_`, "").replace(".json", ""));
    }

    if(count >= 30000) return;
    while(true){
        try{
            if (fs.existsSync(`${dir}/${patch}/${region}/overview_${region}_${ID}.json`)){
                console.log(`overview_${region}_${ID} alredy exists!`);
                ID += 1;
                continue;
            }

            let response = await major_inst.get(`/lol/match/v5/matches/${region}_${ID}`);
            if(response.data['info']['gameCreation'] < yesterday){
                console.log("Making a biiig jump!")
                ID += 100
            }

            if(response.data['info']['queueId'] != 420){
                console.log("*comedicaly loud buzzer noise*")
                ID += 1;
                continue;
            }

            console.log(`Game ${response.data['metadata']['matchId']} Found!(${count}/30000 [${Math.floor(count/300)}%])`);
            rankedSortW((await rankedCleanW(response.data, region, minor_inst)), region, `${dir}/${patch}/${region}`)
            count++;
            if(count > 30000) return;
            ID += 1;
            yesterday = moment().subtract(24, 'hours').unix()
        }catch(error){
            if(!error.response){
                console.error(error)
                return;
            }
            if(error.response.status == 404){
                ID += 1;
                continue;
            }
            if(error.response.status == 400){
                console.log("get a new key");
                return;
            }
            if(error.response.status == 429){
                console.log("overloaded the api whoops!")
                continue;
            }

            console.error(error.response.status)

        }
    }
    console.log(`Done!`)
}