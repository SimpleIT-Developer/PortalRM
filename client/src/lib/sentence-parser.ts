export interface SentenceInfo {
  codSentenca: string;
  titulo: string;
  sentenca: string;
}

export function parseSentenceContent(content: string): SentenceInfo[] {
  const sentences: SentenceInfo[] = [];
  const lines = content.split('\n');
  
  let currentSentence: Partial<SentenceInfo> | null = null;
  let inSqlBlock = false;
  let sqlLines: string[] = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Check if this is a sentence header line (starts with SIT.PORTALRM.XXX)
    const headerMatch = trimmedLine.match(/^(SIT\.PORTALRM\.\d+)\s*-\s*(.+)$/);
    if (headerMatch) {
      // Save previous sentence if exists
      if (currentSentence && sqlLines.length > 0) {
        currentSentence.sentenca = sqlLines.join('\n').trim();
        sentences.push(currentSentence as SentenceInfo);
      }
      
      // Start new sentence
      currentSentence = {
        codSentenca: headerMatch[1],
        titulo: headerMatch[2].trim()
      };
      sqlLines = [];
      inSqlBlock = false;
      continue;
    }
    
    // Start SQL block if line begins with a quote
    if (!inSqlBlock && trimmedLine.startsWith('"')) {
      inSqlBlock = true;
      const cleanStart = trimmedLine.replace(/^"/, '').replace(/"$/, '');
      if (cleanStart) sqlLines.push(cleanStart);
      continue;
    }
    
    // If we're in SQL block and line is not empty, add to SQL
    if (inSqlBlock && trimmedLine) {
      const cleanLine = trimmedLine.replace(/"$/, '');
      sqlLines.push(cleanLine);
      // If line ends with closing quote, end SQL block
      if (trimmedLine.endsWith('"')) {
        inSqlBlock = false;
      }
    }
  }
  
  // Save the last sentence
  if (currentSentence && sqlLines.length > 0) {
    currentSentence.sentenca = sqlLines.join('\n').trim();
    sentences.push(currentSentence as SentenceInfo);
  }
  
  return sentences;
}

export function findSentenceByCod(codSentenca: string, sentences: SentenceInfo[]): SentenceInfo | undefined {
  return sentences.find(s => s.codSentenca === codSentenca);
}
