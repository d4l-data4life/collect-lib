import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { format } from 'prettier';

const prettierOptions = {
  ...JSON.parse(readFileSync(join(__dirname, '..', '.prettierrc.json'), 'utf8')),
  parser: 'markdown',
};

type Heading = { title: string };
type Comment = { comment: string };
type Table = { header: string; rows: string[] };
type Element = Heading | Table | Comment;
const NEWLINE = '\n';

const isTable = (element: Element): element is Table => {
  return (element as Table).header !== undefined && Array.isArray((element as Table).rows);
};

const isComment = (element: Element): element is Comment => {
  return (element as Comment).comment !== undefined;
};

const isHeading = (element: Element): element is Heading => {
  return (element as Heading).title !== undefined;
};

class TypeDocsGenerator {
  readmeFile = './README.md';
  readmeContent: string;
  typesFilePath = './src/types/*.ts';
  CommentRegex = new RegExp('s*// (.*)');
  HeadingRegex = new RegExp('###(.*)');
  PlaceholderRegex = new RegExp(`(<!-- AUTOMATICALLY GENERATED CONTENT -->\n)(.|\n)*`);

  constructor() {
    this.readmeContent = readFileSync(this.readmeFile).toString();
  }

  readTypesFile(type: string): string[] {
    const lines = readFileSync(this.typesFilePath.replace('*', type)).toString().split(NEWLINE);
    const commentLines: string[] = lines
      .filter((line) => this.CommentRegex.test(line))
      .map((line) => this.CommentRegex.exec(line)?.[1] ?? '');
    return commentLines!;
  }

  getElements(lines: string[]) {
    const elements: Element[] = [];
    for (const line of lines) {
      if (this.HeadingRegex.test(line)) {
        elements.push({ title: line });
      } else if (line.includes('|')) {
        // Table
        const previous = elements[elements.length - 1];
        if (isTable(previous)) {
          (elements[elements.length - 1] as Table).rows.push(line);
        } else {
          elements.push({ header: line, rows: [] });
        }
      } else {
        elements.push({ comment: line });
      }
    }
    return elements;
  }

  formatTableMarkdown(table: Table): string {
    let markdown: string[] = [`| ${table.header} |`];
    const columns = table.header.split('|');
    markdown.push(`| ${columns.map(() => ' --- ').join('|')} |`);
    markdown.push(...table.rows.map((line) => `| ${line} |`));

    return markdown.join(NEWLINE) + NEWLINE;
  }

  async updateReadme() {
    const commentLines = [
      ...this.readTypesFile('program'),
      ...this.readTypesFile('survey'),
      ...this.readTypesFile('routine'),
      ...this.readTypesFile('display'),
    ];
    const elements = this.getElements(commentLines);
    const markdownContent = elements
      .map((element) => {
        if (isTable(element)) {
          return this.formatTableMarkdown(element);
        }
        if (isComment(element)) {
          return element.comment + NEWLINE;
        }
        if (isHeading(element)) {
          return element.title + NEWLINE;
        }
      })
      .join(NEWLINE);

    this.readmeContent = await format(
      this.readmeContent.replace(this.PlaceholderRegex, `$1${markdownContent}`),
      prettierOptions
    );
    writeFileSync(this.readmeFile, this.readmeContent);
  }
}

new TypeDocsGenerator().updateReadme();
