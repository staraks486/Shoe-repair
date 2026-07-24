export interface ShoeInsight {
  type: 'fact' | 'quote' | 'craft';
  category: string;
  text: string;
  author?: string;
}

export const SHOE_INSIGHTS: ShoeInsight[] = [
  {
    type: 'quote',
    category: 'Footwear Wisdom',
    text: "Good shoes take you to good places.",
    author: "Seung-Hyun Park"
  },
  {
    type: 'quote',
    category: 'Style & Confidence',
    text: "Give a person the right shoes, and they can conquer the world.",
    author: "Marilyn Monroe"
  },
  {
    type: 'quote',
    category: 'Artisan Craft',
    text: "Shoes transform your body language and attitude. They lift you physically and emotionally.",
    author: "Christian Louboutin"
  },
  {
    type: 'quote',
    category: 'Wisdom',
    text: "Before you judge someone, walk a mile in their shoes.",
    author: "Classic Proverb"
  },
  {
    type: 'quote',
    category: 'Craftsmanship',
    text: "To wear heart on your sleeve is one thing; to wear soul on your soles is true craft.",
    author: "Artisan Motto"
  },
  {
    type: 'fact',
    category: 'History',
    text: "The world's oldest leather shoe, the Areni-1 shoe, is over 5,500 years old and was found preserved in an Armenian cave."
  },
  {
    type: 'fact',
    category: 'Terminology',
    text: "A 'Cordwainer' crafts new bespoke shoes from fine leather, whereas a 'Cobbler' specializes in repairing footwear."
  },
  {
    type: 'fact',
    category: 'Craft History',
    text: "Goodyear welt construction was patented in 1869, enabling shoes to be resoled indefinitely for decades of wear."
  },
  {
    type: 'fact',
    category: 'Origin',
    text: "High heels were originally crafted in the 10th century for Persian cavalry soldiers to lock their boots firmly in stirrups."
  },
  {
    type: 'fact',
    category: 'Trivia',
    text: "Sneakers earned their name in the late 1800s because flexible rubber soles allowed wearers to walk silently."
  },
  {
    type: 'fact',
    category: 'Anatomy',
    text: "The human foot contains 26 bones, 33 joints, and over 100 muscles and tendons working in perfect balance."
  },
  {
    type: 'craft',
    category: 'Leather Care',
    text: "Conditioning full-grain leather every few months restores essential oils and prevents cracking."
  },
  {
    type: 'craft',
    category: 'Artisan Technique',
    text: "Raw cedar shoe trees draw out moisture and keep shoe uppers wrinkle-free between wears."
  },
  {
    type: 'craft',
    category: 'Restoration',
    text: "Hand-patina finishing applies thin coats of pigment to build multidimensional depth on leather uppers."
  },
  {
    type: 'fact',
    category: 'History',
    text: "Distinct left and right shoes were not widely produced until the early 19th century."
  }
];

export const SHOE_FACTS = SHOE_INSIGHTS.map(i => i.text);

