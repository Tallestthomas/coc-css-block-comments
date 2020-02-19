import { commands, ExtensionContext, workspace } from 'coc.nvim';

const replaceLine = (
  line: string,
  replacement: string,
  buffer: any,
  lineNumber: number
) => {
  const cleanedLine = line.slice(0, line.indexOf("}") + 1);

  buffer.setLines(`${cleanedLine} /*${replacement} */`, {
    start: lineNumber
  });
};

const parseAndAppendSelectors = async () => {
  const { nvim } = workspace;
  const buffer = await nvim.buffer;
  const bufferLength = await buffer.length;

  let selector = "";
  let selectors: string[] = [];
  let cleanedSelectors: string[] = [];
  let concatSelector: string = "";
  let line = "";
  const lines: string[] = await buffer.getLines();

  for (let i = 0; i < bufferLength; i++) {
    line = lines[i];
    cleanedSelectors = [];

    if (line.indexOf("{") != -1) {
      selector = line.slice(0, line.indexOf("{")).trim();
      if (selector.slice(0, 1) === "&") {
        selector = selector.substring(1);
      } else {
        selector = " " + selector;
      }
      selectors.push(selector);
    }

    if (line.indexOf("}") != -1) {
      selectors.map(select => {
        if (select.slice(0, 7) === " @media".toLowerCase()) {
        } else if (select.slice(0, 2) === " $") {
        } else {
          cleanedSelectors.push(select);
        }
      });

      concatSelector = cleanedSelectors.join("");

      if (concatSelector.length) {
        replaceLine(lines[i], concatSelector, buffer, i);
      } else {
        replaceLine(lines[i], selectors[selectors.length - 1], buffer, i);
      }
      selectors.pop();
    }
  }
};

export async function activate(context: ExtensionContext): Promise<void> {
  const config = workspace.getConfiguration("cssBlockComments");
  const enabledLanguages = config.get<string[]>('enabledLanguages') || [];

  const enabled = enabledLanguages.some(lang => workspace.filetypes.has(lang));

  if(!enabled) return;

  context.subscriptions.push(
    commands.registerCommand("cssBlockComments.formatFile", async () => {
      parseAndAppendSelectors();
    })
  );

  if (config.get<boolean>("formatOnSave", true)) {
    context.subscriptions.push(
      workspace.registerAutocmd({
        event: "BufWrite",
        request: false,
        callback: async () => {
          parseAndAppendSelectors();
        }
      })
    );
  }
}
