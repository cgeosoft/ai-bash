#!/usr/bin/env node

import { LogLevel } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import yargs from 'yargs';
import { AppModule } from './app.module';
import { AppService } from './app.service';

async function bootstrap() {

    const argv = await yargs(process.argv.slice(2))
        .usage("Usage: $0 [options] <input>")
        .example('$0 -x List all files of this directory', "will list all files of the current directory")
        .option("execute", {
            type: "boolean",
            alias: "x",
            description: "Execute the command",
            default: false
        })
        .count('verbose')
        .alias('v', 'verbose')
        .demandCommand()
        .help()
        .argv

    const logger: LogLevel[] = ["error", "warn"]

    if (argv.verbose > 0) {
        logger.push("log")
    }
    if (argv.verbose > 1) {
        logger.push("verbose")
    }
    if (argv.verbose > 2) {
        logger.push("debug")
    }

    const app = await NestFactory.createApplicationContext(AppModule, { logger });
    const appService = app.get(AppService);
    appService.process(argv._.join(" "), argv.execute);
    await app.close();
}
bootstrap();