import { useVendorStockStore } from '../state/useVendorStockStore';

/**
 * Universal Pan-India Produce Synonyms (Hindi, Hinglish, Marathi, Gujarati, English, Bhojpuri)
 */
export const MULTILINGUAL_SYNONYMS: Record<string, string[]> = {
  tomato: ['tamatar', 'desi tomato', 'tameta', 'tamate', 'tomato', 'tamator', 'tmatar', 'टमाटर', 'टोमॅटो', 'ટમેટા'],
  potato: ['aalu', 'aloo', 'batata', 'potato', 'alu', 'aaloo', 'jyoti', 'आलू', 'बटाटा', 'બટાટા'],
  onion: ['pyaaz', 'pyaz', 'kanda', 'dungli', 'onion', 'piaz', 'kando', 'प्याज', 'कांदा', 'ડુંગળી'],
  apple: ['apple', 'seb', 'shev', 'royal apple', 'shimla apple', 'सेब'],
  banana: ['banana', 'kela', 'kelewale', 'robusta', 'केला', 'केळी'],
  milk: ['milk', 'doodh', 'dudh', 'pouch', 'taaza', 'cream milk', 'दूध', 'દૂધ'],
  paneer: ['paneer', 'panir', 'cottage cheese', 'malai paneer', 'पनीर', 'પનીર'],
  egg: ['egg', 'eggs', 'anda', 'ande', 'white eggs', 'अंडा', 'अंडे'],
  orange: ['orange', 'santra', 'nagpur santra', 'संतरा', 'મોસંબી'],
  chicken: ['chicken', 'murgi', 'curry cut', 'boneless', 'चिकन'],
};

export interface ParsedVendorCommand {
  rawTranscript: string;
  action:
    | 'ADD_STOCK'
    | 'SET_OUT_OF_STOCK'
    | 'SET_IN_STOCK'
    | 'UPDATE_PRICE'
    | 'STORE_TOGGLE'
    | 'EARNINGS_CHECK'
    | 'ORDER_ACCEPT'
    | 'ORDER_PACKED'
    | 'UNKNOWN';
  targetProduce?: string;
  matchedStockId?: string;
  matchedItemNameEn?: string;
  deltaKg: number;
  deltaGrams: number;
  newPriceRupees?: number;
  targetStoreOpen?: boolean;
  orderCodeRequested?: string;
  isHighImpact: boolean;
  confirmationPromptHi?: string;
  confirmationPromptEn?: string;
  userFeedbackHi: string;
  userFeedbackEn: string;
}

/**
 * Parse colloquial regional quantities (e.g. paav kilo, aadha kilo, dhaai kilo, darjan)
 */
export function parseColloquialQuantity(text: string): { kg: number; grams: number } {
  const t = text.toLowerCase();

  // 1. Vernacular Fractions
  if (t.includes('paav') || t.includes('pauwa') || t.includes('pao') || t.includes('paanv')) {
    return { kg: 0, grams: 250 };
  }
  if (t.includes('aadha darjan') || t.includes('adha dozen')) {
    return { kg: 6, grams: 0 };
  }
  if (t.includes('aadha kilo') || t.includes('adha kilo') || t.includes('aadha kg') || t.includes('adha kg')) {
    return { kg: 0, grams: 500 };
  }
  if (t.includes('pawn kilo') || t.includes('paun kilo')) {
    return { kg: 0, grams: 750 };
  }
  if (t.includes('sawa kilo') || t.includes('sava kilo')) {
    return { kg: 1, grams: 250 };
  }
  if (t.includes('derh kilo') || t.includes('dedh kilo') || t.includes('der kilo')) {
    return { kg: 1, grams: 500 };
  }
  if (t.includes('dhaai kilo') || t.includes('dhaye kilo') || t.includes('dhai kilo')) {
    return { kg: 2, grams: 500 };
  }
  if (t.includes('ek darjan') || t.includes('darjan') || t.includes('dozen')) {
    return { kg: 12, grams: 0 };
  }

  // 2. Standard Regex pattern (e.g. "5 kg", "20 kilo", "500 gram", "10 packet", "6 pcs")
  const numUnitRegex = /(\d+(?:\.\d+)?)\s*(kg|kilo|kilos|g|gm|gms|gram|grams|pc|pcs|piece|pieces|packet|packets|pkt|pkts|doz|dozen|l|litre|ml)\b/i;
  const match = t.match(numUnitRegex);
  if (match) {
    const val = parseFloat(match[1]);
    const unit = match[2].toLowerCase();

    if (unit.startsWith('g') && !unit.startsWith('k')) {
      const kg = Math.floor(val / 1000);
      const grams = Math.round(val % 1000);
      return { kg, grams };
    }
    const kg = Math.floor(val);
    const grams = Math.round((val - kg) * 1000);
    return { kg, grams };
  }

  // 3. Lone Number fallback (e.g. "tamatar 20 add karo")
  const loneNum = t.match(/\b(\d+)\b/);
  if (loneNum) {
    return { kg: parseInt(loneNum[1], 10), grams: 0 };
  }

  // Default step
  return { kg: 5, grams: 0 };
}

/**
 * Match spoken text to active stock produce item in the store
 */
export function matchProduceItem(text: string) {
  const t = text.toLowerCase();
  const currentStock = useVendorStockStore.getState().items;

  for (const [canonical, synonyms] of Object.entries(MULTILINGUAL_SYNONYMS)) {
    const isMatched = synonyms.some((syn) => t.includes(syn));
    if (isMatched) {
      // Find corresponding item in current stock
      const found = currentStock.find(
        (item) =>
          item.nameEn.toLowerCase().includes(canonical) ||
          synonyms.some((s) => item.nameEn.toLowerCase().includes(s))
      );
      if (found) {
        return { item: found, canonicalKey: canonical };
      }
    }
  }

  // Fallback: direct substring match in current stock
  const directMatch = currentStock.find((item) => t.includes(item.nameEn.toLowerCase()));
  if (directMatch) {
    return { item: directMatch, canonicalKey: directMatch.nameEn };
  }

  return null;
}

/**
 * Main Multilingual Voice Command Parser
 */
export function parseVendorVoiceCommand(transcript: string): ParsedVendorCommand {
  const raw = (transcript || '').trim();
  const t = raw.toLowerCase();

  // 1. STORE CLOSE / OPEN (Toggle store availability)
  if (
    t.includes('dukan band') ||
    t.includes('store close') ||
    t.includes('store band') ||
    t.includes('dukan badha') ||
    t.includes('band karo') ||
    t.includes('close store')
  ) {
    return {
      rawTranscript: raw,
      action: 'STORE_TOGGLE',
      targetStoreOpen: false,
      deltaKg: 0,
      deltaGrams: 0,
      isHighImpact: true,
      confirmationPromptHi: 'दुकान बंद करें? नए ऑनलाइन ऑर्डर आना बंद हो जाएंगे।',
      confirmationPromptEn: 'Close shop? Incoming online orders will stop.',
      userFeedbackHi: 'दुकान बंद कर दी गई है (नए ऑर्डर आना बंद हो गए हैं)।',
      userFeedbackEn: 'Store has been marked Closed (Incoming orders stopped).',
    };
  }

  if (
    t.includes('dukan khol') ||
    t.includes('dukan chalu') ||
    t.includes('store open') ||
    t.includes('store chalu') ||
    t.includes('khol do') ||
    t.includes('open store')
  ) {
    return {
      rawTranscript: raw,
      action: 'STORE_TOGGLE',
      targetStoreOpen: true,
      deltaKg: 0,
      deltaGrams: 0,
      isHighImpact: false,
      userFeedbackHi: 'दुकान खोल दी गई है (नए ऑर्डर चालू हैं)।',
      userFeedbackEn: 'Store is now Open and accepting incoming orders!',
    };
  }

  // 2. EARNINGS / PAYOUT INQUIRY
  if (
    t.includes('kamai') ||
    t.includes('earning') ||
    t.includes('earnings') ||
    t.includes('kitna kamaya') ||
    t.includes('aaj ka paisa') ||
    t.includes('payout') ||
    t.includes('balance') ||
    t.includes('hisab')
  ) {
    return {
      rawTranscript: raw,
      action: 'EARNINGS_CHECK',
      deltaKg: 0,
      deltaGrams: 0,
      isHighImpact: false,
      userFeedbackHi: 'आज आपकी कुल कमाई ₹28,780 है। 34 ऑर्डर पूरे हुए हैं।',
      userFeedbackEn: "Today's total earnings are ₹28,780 across 34 completed orders.",
    };
  }

  // 3. ORDER ACCEPT & PACK
  if (t.includes('order accept') || t.includes('accept order') || t.includes('naya order le lo') || t.includes('order lo')) {
    const orderNumMatch = t.match(/(\d{4})/);
    const orderCodeRequested = orderNumMatch ? `#DM-${orderNumMatch[1]}` : undefined;

    return {
      rawTranscript: raw,
      action: 'ORDER_ACCEPT',
      deltaKg: 0,
      deltaGrams: 0,
      orderCodeRequested,
      isHighImpact: true,
      confirmationPromptHi: orderCodeRequested
        ? `ऑर्डर ${orderCodeRequested} स्वीकार करें?`
        : 'पेंडिंग ऑर्डर स्वीकार करें?',
      confirmationPromptEn: orderCodeRequested
        ? `Accept order ${orderCodeRequested}?`
        : 'Accept pending order?',
      userFeedbackHi: 'ऑर्डर स्वीकार कर लिया गया है।',
      userFeedbackEn: 'Order accepted!',
    };
  }

  if (t.includes('pack ho gaya') || t.includes('order pack') || t.includes('packing complete') || t.includes('ready ho gaya')) {
    return {
      rawTranscript: raw,
      action: 'ORDER_PACKED',
      deltaKg: 0,
      deltaGrams: 0,
      isHighImpact: false,
      userFeedbackHi: 'ऑर्डर पैक चिह्नित कर दिया गया है। डिलीवरी पार्टनर को सूचित किया गया।',
      userFeedbackEn: 'Order marked as Packed & Ready for delivery pickup.',
    };
  }

  // Resolve target item for stock/price actions
  const matched = matchProduceItem(t);

  // 4. OUT OF STOCK / IN STOCK TOGGLE
  if (
    t.includes('khatam') ||
    t.includes('out of stock') ||
    t.includes('nahi hai') ||
    t.includes('sampala') ||
    t.includes('khalas')
  ) {
    if (matched) {
      return {
        rawTranscript: raw,
        action: 'SET_OUT_OF_STOCK',
        targetProduce: matched.item.nameEn,
        matchedStockId: matched.item.id,
        matchedItemNameEn: matched.item.nameEn,
        deltaKg: 0,
        deltaGrams: 0,
        isHighImpact: true,
        confirmationPromptHi: `${matched.item.nameEn} को Out of Stock करें? ग्राहक इसे ऑर्डर नहीं कर पाएंगे।`,
        confirmationPromptEn: `Mark ${matched.item.nameEn} as Out of Stock? Customers will not be able to order it.`,
        userFeedbackHi: `${matched.item.nameEn} को Out of Stock (स्टॉक समाप्त) कर दिया गया है।`,
        userFeedbackEn: `${matched.item.nameEn} marked Out of Stock.`,
      };
    }
  }

  if (t.includes('in stock') || t.includes('wapas aa gaya') || t.includes('stock me hai')) {
    if (matched) {
      return {
        rawTranscript: raw,
        action: 'SET_IN_STOCK',
        targetProduce: matched.item.nameEn,
        matchedStockId: matched.item.id,
        matchedItemNameEn: matched.item.nameEn,
        deltaKg: 10,
        deltaGrams: 0,
        isHighImpact: false,
        userFeedbackHi: `${matched.item.nameEn} को दोबारा In Stock (स्टॉक में) कर दिया गया है।`,
        userFeedbackEn: `${matched.item.nameEn} is back In Stock.`,
      };
    }
  }

  // 5. UPDATE PRICE (Rate / Bhav)
  if (t.includes('rate') || t.includes('bhav') || t.includes('price') || t.includes('daam') || t.includes('rupay') || t.includes('₹')) {
    const priceMatch = t.match(/(\d+)\s*(?:rupay|rupee|rs|ka|bhav|rate)?/);
    if (priceMatch && matched) {
      const newPrice = parseInt(priceMatch[1], 10);
      return {
        rawTranscript: raw,
        action: 'UPDATE_PRICE',
        targetProduce: matched.item.nameEn,
        matchedStockId: matched.item.id,
        matchedItemNameEn: matched.item.nameEn,
        deltaKg: 0,
        deltaGrams: 0,
        newPriceRupees: newPrice,
        isHighImpact: false,
        userFeedbackHi: `${matched.item.nameEn} का नया रेट ₹${newPrice} सेट कर दिया गया है।`,
        userFeedbackEn: `${matched.item.nameEn} price updated to ₹${newPrice}.`,
      };
    }
  }

  // 6. ADD / REFILL STOCK
  if (
    t.includes('add') ||
    t.includes('daal') ||
    t.includes('badha') ||
    t.includes('rakh') ||
    t.includes('nakho') ||
    t.includes('taka') ||
    matched
  ) {
    if (matched) {
      const { kg, grams } = parseColloquialQuantity(t);
      const curKg = matched.item.stockKg ?? 0;
      const finalKg = curKg + kg;

      return {
        rawTranscript: raw,
        action: 'ADD_STOCK',
        targetProduce: matched.item.nameEn,
        matchedStockId: matched.item.id,
        matchedItemNameEn: matched.item.nameEn,
        deltaKg: kg,
        deltaGrams: grams,
        isHighImpact: false,
        userFeedbackHi: `${matched.item.nameEn} अब ${finalKg} किलो (Stock: ${finalKg} kg).`,
        userFeedbackEn: `${matched.item.nameEn} is now ${finalKg} kg (Stock: ${finalKg} kg).`,
      };
    }
  }

  // 7. UNKNOWN / UNCLEAR
  return {
    rawTranscript: raw,
    action: 'UNKNOWN',
    deltaKg: 0,
    deltaGrams: 0,
    isHighImpact: false,
    userFeedbackHi: `आवाज समझ नहीं आई ("${raw}"). कृपया साफ बोलें जैसे: "टमाटर 20 किलो ऐड करो" या "दुकान बंद करो"।`,
    userFeedbackEn: `Command not recognized ("${raw}"). Try saying: "Add 20 kg Tomato" or "Mark store closed".`,
  };
}
