export const twitterUsers = [
  { userId: "1354400126857605121", handle: "AltcoinGordon" },
  { userId: "864011281", handle: "KookCapitalLLC" },
  { userId: "1502733964808650754", handle: "SolJakey" },
  { userId: "333357345", handle: "Cobratate" },
  { userId: "4663060634", handle: "mezoteric" },
  { userId: "1749286265583722496", handle: "idrawline" },
  { userId: "1622243071806128131", handle: "pumpdotfun" },
  { userId: "1404603419101306881", handle: "kmoney_69" },
  { userId: "1243470638477697024", handle: "ZssBecker" },
  { userId: "973261472", handle: "blknoiz06" },
  { userId: "1655041057120296960", handle: "0xvisitor" },
  { userId: "844304603336232960", handle: "MustStopMurad" },
  { userId: "1509239489021030405", handle: "slingdeez" },
  { userId: "1664955003113553920", handle: "json1444" },
  { userId: "1509239489021030405", handle: "Saint10Fourteen" },
  { userId: "1681718524228648961", handle: "xbtcas" },
  { userId: "986900699366604800", handle: "digitalartchick" },
  { userId: "1595792813244948480", handle: "cryptic_tits" },
  { userId: "1585307868856827905", handle: "CYBER__BULLY" },
  { userId: "1533297503076237312", handle: "youngjazzeth" },
  { userId: "1351139954525696005", handle: "beaniemaxi" },
  { userId: "878219545785372673", handle: "CryptoDonAlt" },
  { userId: "1512682935547277319", handle: "WuWei113" },
];

export const systemRoles = [
  // "You are a dull 18 year old gambling addict with bad grammar and never capitalises his sentences",
  // "You are a depressed, moody teenager with bad grammar and never capitalises her sentences",
  // "You are an uneducated hillbilly who failed high school but likes to pretend he's a philosopher",
  "You are Tiresias, the blind prophet of Apollo from Greek mythology, reimagined as a degen crypto analyst. Known for your sharp, concise predictions, rage-baiting insights, you provoke the crypto community with your unfiltered takes on market trends. You blend elevated language with Gen Z slang, keeping your commentary both prophetic and irreverently current",
  "You are Tiresias, the blind prophet of Apollo from Greek mythology, reimagined as a degen crypto analyst. Known for your sharp, concise predictions, rage-baiting insights, and , you provoke the crypto community with your unfiltered takes on market trends. Your commentary is a mix of sharp punchlines, irreverent humor, and unfiltered Solana superiority. Avoid emojis and hashtags, but lean into phrasings like lowkey, deadass, this ain’t it, and other slang that resonates with the TikTok generation.",
  // "You are a philosopher who likes to use big words",
];

export const basePrompts = [
  "Give me a short degenerate sentence based on these tweets without using any emojis or the word 'crypto', with up to 20 words: ",
  "Give me a prediction based on these tweets without using any emojis or the word 'crypto', with up to 20 words: ",
  "Give me a degenerate statement to these people being aggressive to you without using any emojis or the word 'crypto', with up to 20 words: ",
  "Give me a sassy statement to these tweets without using any emojis or the word 'crypto', with up to 20 words: ",
  // "Give me a haiku based on these tweets without using the word 'crypto' or any emojis: ",
];

export const replyPrompts = [
  "Give me a sassy reply to this tweet without using any emojis or the word 'crypto', with up to 20 words: ",
  "Give me a degenerate reply to this person being aggressive to you without using any emojis or the word 'crypto', with up to 20 words: ",
  // "Give me a poetic response to this without using the word 'crypto' or any emojis, with up to 20 words: ",
];

export const forbiddenWords = [
  "https://t.co/", // tweet has image
  "nigga", // GPT model will not respond to racism
  "nigger", // GPT model will not respond to racism
];
