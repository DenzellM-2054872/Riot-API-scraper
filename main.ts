
import {Command} from 'commander'
import getDown from './get-down';
import sortClean from './sort-clean';
const program = new Command();
program.command("get-down")
    .description("Will collect all the league of legends games in descending order  starting at the id of the first game in the directory (or the one given if the directory is empty). This assumes standard api rates")
    .argument("<region>", "the region you want to collect the games of")
    .option("-d, --dir [path]", "the directory to which to write the files", "data/")
    .option("-i, --id <number>", "the id number of the first game to collect")
    .option("-p, --patch [patch]", "the patch nr of games you want to collect", "15.4")
    .option("-t, --token [path]", "the file for your api token", "api_key.txt")
    .action((str, options) => {getDown(str, options)});

program.command("get-up")
    .description("Will collect all the league of legends games in ascending order starting at the id of the last game in the directory (or the one given if the directory is empty). This assumes standard api rates")
    .argument("<region>", "the region you want to collect the games of")
    .option("-d, --dir [path]", "the directory to which to write the files", "data/")
    .option("-i, --id <number>", "the id number of the first game to collect")
    .option("-p, --patch [patch]", "the patch nr of games you want to collect", "15.4")
    .option("-t, --token [path]", "the file for your api token", "api_key.txt")
    .action((str, options) => {getDown(str, options)});

program.command("clean-sort")
    .description("this will get rid of some redundant data and put the files in the apropriate folders")
    .argument("<region>", "the locaion of the data folder")
    .action((str, options) => {sortClean(str, options)});

program.parse();


