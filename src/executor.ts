import childProcess from "child_process";

export class Executor {
  static execute(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      childProcess.exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
  }

  static executeSync(command: string): string {
    return childProcess.execSync(command).toString();
  }
}
