import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
// const { exec } = require('node:child_process')
import { exec } from 'child_process';

const chalkLoadAsync = Function('return import("chalk")')() as Promise<typeof import('chalk')>

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface Message {
  role: string;
  content: string;
}

export interface Choice {
  message: Message;
  finish_reason?: any;
  index: number;
}

export interface ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  usage: Usage;
  choices: Choice[];
}


@Injectable()
export class AppService {

  constructor(private readonly httpService: HttpService) {
  }

  async process(input: string, execute = false) {

    const chalk = await chalkLoadAsync.then((chalk) => chalk.default)

    console.log("Request:\t", chalk.red(input))
    const start = process.hrtime();
    this.httpService
      .post<ChatResponse>('https://api.openai.com/v1/chat/completions', {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a assistant that generate bash commands from user input. generate only the bash script and no other output or explanation. bash script sould be one line." },
          { role: "user", content: input }
        ]
      }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        }
      })
      .subscribe(response => {
        const command = response.data.choices[0].message.content

        const ellapsed = process.hrtime(start);
        const ellapsedMs = Math.floor(ellapsed[0] * 1000 + ellapsed[1] / 1000000);

        console.log(
          `Response:\t`,
          `time: ${chalk.yellow(ellapsedMs + 'ms')}`,
          `tokens: ${chalk.yellow(response.data.usage.total_tokens)}`,
          `cost: ${chalk.yellow('$' + (response.data.usage.total_tokens * 0.002 / 1000).toFixed(6))}`
        )

        if (!execute) {
          console.log("Command:\t", chalk.green(command))
          return
        }

        console.log("Executing:\t", chalk.green(command))
        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.log("error:\t", error.message);
            return;
          }
          if (stderr) {
            console.log("stderr:\t", stderr);
            return;
          }
          console.log(stdout);
        });
      })
  }
}
