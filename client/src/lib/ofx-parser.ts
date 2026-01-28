
export interface OfxTransaction {
  id: string;
  date: Date;
  amount: number;
  description: string;
  type: 'CREDIT' | 'DEBIT';
  checkNum?: string;
  refNum?: string;
}

export interface OfxData {
  accountId: string;
  bankId: string;
  transactions: OfxTransaction[];
  balance: number;
  currency: string;
}

export function parseOfx(content: string): OfxData {
  const transactions: OfxTransaction[] = [];
  let accountId = '';
  let bankId = '';
  let balance = 0;
  let currency = 'BRL';

  // Extract Account ID
  const acctIdMatch = content.match(/<ACCTID>(.*?)(\r|\n|<)/);
  if (acctIdMatch) accountId = acctIdMatch[1].trim();

  // Extract Bank ID
  const bankIdMatch = content.match(/<BANKID>(.*?)(\r|\n|<)/);
  if (bankIdMatch) bankId = bankIdMatch[1].trim();

  // Extract Currency
  const curDefMatch = content.match(/<CURDEF>(.*?)(\r|\n|<)/);
  if (curDefMatch) currency = curDefMatch[1].trim();

  // Extract Balance
  const balAmtMatch = content.match(/<BALAMT>(.*?)(\r|\n|<)/);
  if (balAmtMatch) balance = parseFloat(balAmtMatch[1].replace(',', '.'));

  // Extract Transactions
  // We split by <STMTTRN> to get each transaction block
  const transactionBlocks = content.split('<STMTTRN>');
  
  // Skip the first part (header)
  for (let i = 1; i < transactionBlocks.length; i++) {
    const block = transactionBlocks[i];
    
    const typeMatch = block.match(/<TRNTYPE>(.*?)(\r|\n|<)/);
    const dateMatch = block.match(/<DTPOSTED>(.*?)(\r|\n|<)/);
    const amountMatch = block.match(/<TRNAMT>(.*?)(\r|\n|<)/);
    const idMatch = block.match(/<FITID>(.*?)(\r|\n|<)/);
    const memoMatch = block.match(/<MEMO>(.*?)(\r|\n|<)/);
    const checkNumMatch = block.match(/<CHECKNUM>(.*?)(\r|\n|<)/);
    const refNumMatch = block.match(/<REFNUM>(.*?)(\r|\n|<)/);

    if (dateMatch && amountMatch && idMatch) {
      const amount = parseFloat(amountMatch[1].replace(',', '.'));
      
      // Parse date: YYYYMMDDHHMMSS or YYYYMMDD
      const dateStr = dateMatch[1].trim().substring(0, 8);
      const year = parseInt(dateStr.substring(0, 4));
      const month = parseInt(dateStr.substring(4, 6)) - 1; // JS months are 0-based
      const day = parseInt(dateStr.substring(6, 8));
      
      transactions.push({
        id: idMatch[1].trim(),
        date: new Date(year, month, day, 12, 0, 0),
        amount: amount,
        description: memoMatch ? memoMatch[1].trim() : '',
        type: amount < 0 ? 'DEBIT' : 'CREDIT',
        checkNum: checkNumMatch ? checkNumMatch[1].trim() : undefined,
        refNum: refNumMatch ? refNumMatch[1].trim() : undefined
      });
    }
  }

  return {
    accountId,
    bankId,
    transactions,
    balance,
    currency
  };
}
