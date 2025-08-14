import { db } from '../db';
import { studentCardsTable } from '../db/schema';
import { like, sql } from 'drizzle-orm';

export async function generateCardNumber(): Promise<string> {
  try {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const basePattern = `CARD-${dateStr}`;
    
    // Query existing card numbers for today
    const existingCards = await db.select({
      card_number: studentCardsTable.card_number
    })
    .from(studentCardsTable)
    .where(like(studentCardsTable.card_number, `${basePattern}-%`))
    .execute();

    // Extract sequential numbers from existing cards
    const existingNumbers = existingCards
      .map(card => {
        const parts = card.card_number.split('-');
        return parts.length === 3 ? parseInt(parts[2], 10) : 0;
      })
      .filter(num => !isNaN(num));

    // Find the next sequential number
    let nextNumber = 1;
    if (existingNumbers.length > 0) {
      const maxNumber = Math.max(...existingNumbers);
      nextNumber = maxNumber + 1;
    }

    // Format the sequential number with leading zeros (001, 002, etc.)
    const sequentialNumber = nextNumber.toString().padStart(3, '0');
    
    return `${basePattern}-${sequentialNumber}`;
  } catch (error) {
    console.error('Card number generation failed:', error);
    throw error;
  }
}