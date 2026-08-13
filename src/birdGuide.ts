import type { BirdRule } from "./types";

export type BirdGuideEntry = {
  id: string;
  name: string;
  group: "Ducks" | "Geese" | "Other";
  image: string;
  markers: string[];
  sourceUrl: string;
  credit: string;
};

export const birdGuideEntries: BirdGuideEntry[] = [
  {
    id: "mallard-drake",
    name: "Mallard — Drake",
    group: "Ducks",
    image: "/birds/mallard-drake.jpg",
    markers: [
      "Glossy green head, narrow white neck ring, and chestnut breast.",
      "Yellow bill, gray body, and black curled tail feathers.",
      "Blue-violet wing patch bordered by white bars.",
    ],
    sourceUrl: "https://www.fws.gov/media/mallard-drake-1",
    credit: "Dave Menke / USFWS — Public Domain",
  },
  {
    id: "mallard-hen",
    name: "Mallard — Hen",
    group: "Ducks",
    image: "/birds/mallard-hen.jpg",
    markers: [
      "Mottled warm-brown body with a darker crown and eye line.",
      "Orange-and-black bill; generally darker than many other hen dabblers.",
      "Blue-violet wing patch bordered by distinct white bars.",
    ],
    sourceUrl: "https://www.fws.gov/media/mallard-female",
    credit: "USFWS — Public Domain",
  },
  {
    id: "american-black-duck",
    name: "American Black Duck",
    group: "Ducks",
    image: "/birds/american-black-duck.jpg",
    markers: [
      "Very dark chocolate-brown body with a noticeably paler head and neck.",
      "Violet-blue wing patch usually lacks the bold white borders of a mallard.",
      "White underwings contrast strongly with the dark body in flight.",
    ],
    sourceUrl: "https://www.fws.gov/media/american-black-duck",
    credit: "Gene Nieminen / USFWS — Public Domain",
  },
  {
    id: "mottled-duck",
    name: "Mottled Duck",
    group: "Ducks",
    image: "/birds/mottled-duck.png",
    markers: [
      "Rich, dark-brown body with a noticeably paler buff head and dark eye line.",
      "Blackish gape spot at the base of the bill helps separate it from a hen mallard.",
      "Violet-blue wing patch generally lacks the broad white borders of a mallard.",
    ],
    sourceUrl: "https://www.fws.gov/media/mottled-duck-resizedpng",
    credit: "USFWS — Public Domain",
  },
  {
    id: "black-bellied-whistling-duck",
    name: "Black-bellied Whistling-Duck",
    group: "Ducks",
    image: "/birds/black-bellied-whistling-duck.jpg",
    markers: [
      "Long pink legs, bright pink bill, and a gray face with a chestnut crown.",
      "Chestnut body contrasts with a black belly and broad white wing patch.",
      "Long-necked, long-legged silhouette often perches in trees and gives clear whistled calls.",
    ],
    sourceUrl: "https://www.fws.gov/media/black-bellied-whistling-duck-1",
    credit: "Robert H. Burton / USFWS — Public Domain",
  },
  {
    id: "wood-duck",
    name: "Wood Duck",
    group: "Ducks",
    image: "/birds/wood-duck.jpg",
    markers: [
      "Drake has a swept-back iridescent crest with bold white facial lines and a red eye.",
      "Drake shows a chestnut breast; hen is gray-brown with a white teardrop eye ring.",
      "Compact body, broad wings, and a long square tail in flight.",
    ],
    sourceUrl: "https://www.fws.gov/media/wood-duck-17",
    credit: "George Gentry / USFWS — Public Domain",
  },
  {
    id: "blue-winged-teal",
    name: "Blue-winged Teal",
    group: "Ducks",
    image: "/birds/blue-winged-teal.jpg",
    markers: [
      "Small, fast-flying dabbling duck with powder-blue upperwing coverts.",
      "Breeding drake has a slate-gray head with a bold white facial crescent.",
      "Hen is mottled brown with a dark eye line and a small black bill.",
    ],
    sourceUrl: "https://www.fws.gov/media/blue-winged-teal-1",
    credit: "Clayton Ferrell / USFWS — Public Domain",
  },
  {
    id: "gadwall",
    name: "Gadwall",
    group: "Ducks",
    image: "/birds/gadwall.jpg",
    markers: [
      "Drake is finely patterned gray-brown with a black rear and dark bill.",
      "Both sexes show a bright white wing patch that is especially obvious in flight.",
      "Hen resembles a mallard hen but has a thinner dark bill edged with orange.",
    ],
    sourceUrl: "https://www.fws.gov/media/gadwall-2",
    credit: "Gary Kramer / USFWS — Public Domain",
  },
  {
    id: "american-wigeon",
    name: "American Wigeon",
    group: "Ducks",
    image: "/birds/american-wigeon.jpg",
    markers: [
      "Drake has a white crown, green eye patch, and pinkish-brown breast and sides.",
      "Short blue-gray bill has a black tip; both sexes have a round-headed profile.",
      "Large white shoulder patch is conspicuous on the drake in flight.",
    ],
    sourceUrl: "https://www.fws.gov/media/american-wigeon-8",
    credit: "Lee Karney / USFWS — Public Domain",
  },
  {
    id: "northern-shoveler",
    name: "Northern Shoveler",
    group: "Ducks",
    image: "/birds/northern-shoveler.jpg",
    markers: [
      "Very large spoon-shaped bill is the clearest field mark in both sexes.",
      "Drake has a deep green head, white chest, rusty sides, and pale-blue shoulder patch.",
      "Hen is mottled brown and can resemble a mallard hen, but the oversized bill stands out.",
    ],
    sourceUrl: "https://www.fws.gov/media/northern-shoveler-1",
    credit: "Lee Karney / USFWS — Public Domain",
  },
  {
    id: "northern-pintail",
    name: "Northern Pintail",
    group: "Ducks",
    image: "/birds/northern-pintail.jpg",
    markers: [
      "Long, slender neck and pointed tail give both sexes an elegant profile.",
      "Drake has a chocolate head and white stripe running up the neck.",
      "Hen is finely mottled brown with a gray bill and noticeably pointed tail.",
    ],
    sourceUrl: "https://www.fws.gov/media/northern-pintail-12",
    credit: "Dave Menke / USFWS — Public Domain",
  },
  {
    id: "redhead",
    name: "Redhead",
    group: "Ducks",
    image: "/birds/redhead.jpg",
    markers: [
      "Drake has a round cinnamon-red head, black chest, and pale gray body.",
      "Blue-gray bill has a black tip; the forehead rises more abruptly than a canvasback's.",
      "Hen is warm brown with a paler face around the bill and a rounded head.",
    ],
    sourceUrl: "https://www.fws.gov/media/redhead-ducks-funk-waterfowl-production-area-rainwater-basin-wetland-management-district",
    credit: "Jessica Bolser / USFWS — Public Domain",
  },
  {
    id: "canvasback",
    name: "Canvasback",
    group: "Ducks",
    image: "/birds/canvasback.jpg",
    markers: [
      "Long, dark bill and low, sloping forehead create a wedge-shaped head profile.",
      "Drake has a rusty-red head, black chest, and very pale back and sides.",
      "Hen is tawny brown but retains the distinctive long bill and sloping profile.",
    ],
    sourceUrl: "https://www.fws.gov/media/canvasback",
    credit: "Clayton Ferrell / USFWS — Public Domain",
  },
  {
    id: "scaup",
    name: "Scaup",
    group: "Ducks",
    image: "/birds/scaup.jpg",
    markers: [
      "Compact diving duck with a dark head, pale body, and broad blue-gray bill.",
      "Drakes show black breast and finely barred gray back; hens have white near the bill.",
      "Greater and lesser scaup are difficult to separate—check head shape and wing stripe carefully.",
    ],
    sourceUrl: "https://www.fws.gov/media/scaup-ducks-0",
    credit: "Forrest B. Lee / USFWS — Public Domain",
  },
  {
    id: "ring-necked-duck",
    name: "Ring-necked Duck",
    group: "Ducks",
    image: "/birds/ring-necked-duck.jpg",
    markers: [
      "Drake has a black, slightly peaked head and back with pale-gray sides.",
      "Bill has a white band near the black tip plus a white border at its base.",
      "Hen is warm brown with a pale face patch and a white eye ring.",
    ],
    sourceUrl: "https://www.fws.gov/media/ring-necked-duck-3",
    credit: "Stephen Tuttle / USFWS — Public Domain",
  },
  {
    id: "bufflehead",
    name: "Bufflehead",
    group: "Ducks",
    image: "/birds/bufflehead.jpg",
    markers: [
      "Very small diving duck with a compact body and oversized, rounded head.",
      "Drake is bold black-and-white with a large white patch wrapping the back of the head.",
      "Hen is gray-brown with a small white cheek patch behind the eye.",
    ],
    sourceUrl: "https://www.fws.gov/media/buffleheads-0",
    credit: "Roy W. Lowe / USFWS — Public Domain",
  },
  {
    id: "goldeneye",
    name: "Common Goldeneye",
    group: "Ducks",
    image: "/birds/goldeneye.jpg",
    markers: [
      "Bright golden-yellow eye and a large, rounded head give the bird its name.",
      "Drake has a dark green-black head with a round white spot near the bill and a white body.",
      "Hen has a chocolate-brown head, gray body, and a mostly dark bill often tipped yellow-orange.",
    ],
    sourceUrl: "https://www.fws.gov/media/common-goldeneye-6",
    credit: "USFWS — Public Domain",
  },
  {
    id: "merganser",
    name: "Common Merganser",
    group: "Ducks",
    image: "/birds/merganser.jpg",
    markers: [
      "Long, narrow red bill with serrated edges and a streamlined diving-duck shape.",
      "Drake has a dark green head and mostly white body with a black back.",
      "Hen has a rusty, shaggy-crested head sharply divided from a gray body.",
    ],
    sourceUrl: "https://www.fws.gov/media/common-merganser-1",
    credit: "John and Karen Hollingsworth / USFWS — Public Domain",
  },
  {
    id: "harlequin-duck",
    name: "Harlequin Duck",
    group: "Ducks",
    image: "/birds/harlequin-duck.jpg",
    markers: [
      "Small sea duck with a compact body, steep forehead, and short bill.",
      "Drake is slate-blue with bold white spots and stripes outlined in black plus chestnut sides.",
      "Hen is dark brown with a round white cheek spot and smaller pale patch near the bill.",
    ],
    sourceUrl: "https://www.fws.gov/media/harlequin-duck",
    credit: "Jake Bonello / USFWS — Public Domain",
  },
  {
    id: "long-tailed-duck",
    name: "Long-tailed Duck",
    group: "Ducks",
    image: "/birds/long-tailed-duck.jpg",
    markers: [
      "Drake has very long, thin central tail feathers and bold black-and-white plumage.",
      "Plumage changes markedly by season; winter drakes show a white head with a dark cheek patch.",
      "Small-headed sea duck with a short bill and quick, stiff-winged flight.",
    ],
    sourceUrl: "https://www.fws.gov/media/long-tailed-duck",
    credit: "Amanda Boyd / USFWS — Public Domain",
  },
  {
    id: "scoter",
    name: "Surf Scoter",
    group: "Ducks",
    image: "/birds/scoter.jpg",
    markers: [
      "Large, heavy-bodied sea duck with a thick neck and a deep, wedge-shaped bill.",
      "Drake is black with bold white patches on the forehead and back of the neck.",
      "Multicolored bill on the drake; hens are dark brown with two pale facial patches.",
    ],
    sourceUrl: "https://www.fws.gov/media/surf-scoter-1",
    credit: "Lee Karney / USFWS — Public Domain",
  },
  {
    id: "canada-goose",
    name: "Canada Goose",
    group: "Geese",
    image: "/birds/canada-goose.jpg",
    markers: [
      "Black head and long black neck with a bold white cheek-and-chin patch.",
      "Brown back and sides with a paler breast; black bill and feet.",
      "Cackling geese look similar but are generally smaller with shorter necks and bills.",
    ],
    sourceUrl: "https://www.fws.gov/media/canada-geese-7",
    credit: "John Magera / USFWS — Public Domain",
  },
  {
    id: "snow-goose",
    name: "Snow / Blue / Ross’s Goose",
    group: "Geese",
    image: "/birds/snow-goose.jpg",
    markers: [
      "White-morph snow geese are white with black wingtips, pink legs, and a pink bill.",
      "Blue morph has a dark slate body and white head; both show a dark bill 'grin patch.'",
      "Ross’s goose is smaller, shorter-billed, and lacks the strong grin patch.",
    ],
    sourceUrl: "https://www.fws.gov/media/snow-geese-6",
    credit: "Dave Menke / USFWS — Public Domain",
  },
  {
    id: "white-fronted-goose",
    name: "Greater White-fronted Goose",
    group: "Geese",
    image: "/birds/white-fronted-goose.jpg",
    markers: [
      "Brown goose with a white patch around the base of its pinkish-orange bill.",
      "Adults show irregular black bars or blotches across the pale belly.",
      "Orange legs and a high-pitched laughing call help separate it from Canada geese.",
    ],
    sourceUrl: "https://www.fws.gov/media/greater-white-fronted-goose-3",
    credit: "Arkansas Game and Fish / USFWS — Public Domain",
  },
  {
    id: "brant",
    name: "Brant",
    group: "Geese",
    image: "/birds/brant.jpg",
    markers: [
      "Small, dark coastal goose with a short black bill and black head and neck.",
      "Adults show a narrow broken white necklace or patch high on the neck.",
      "Dark chest contrasts with a paler belly; white undertail is conspicuous from behind.",
    ],
    sourceUrl: "https://www.fws.gov/media/brant-pair",
    credit: "Peter Mickelson / USFWS — Public Domain",
  },
  {
    id: "american-coot",
    name: "American Coot",
    group: "Other",
    image: "/birds/american-coot.jpg",
    markers: [
      "Charcoal-gray to black body with a bright white bill and frontal shield.",
      "Red eye and greenish legs with lobed—not webbed—toes.",
      "Often bobs its head while swimming and runs across the water before taking flight.",
    ],
    sourceUrl: "https://www.fws.gov/media/american-coot-6",
    credit: "USFWS — Public Domain",
  },
  {
    id: "tundra-swan",
    name: "Tundra Swan",
    group: "Other",
    image: "/birds/tundra-swan.jpg",
    markers: [
      "Very large, all-white waterfowl with a long neck and black bill and feet.",
      "Often shows a small yellow spot in front of the eye, though it can be hard to see.",
      "Juveniles are grayish; hunters must distinguish swans from protected trumpeter swans where required.",
    ],
    sourceUrl: "https://www.fws.gov/media/tundra-swan",
    credit: "Lisa Hupp / USFWS — Public Domain",
  },
  {
    id: "wilsons-snipe",
    name: "Wilson’s Snipe",
    group: "Other",
    image: "/birds/wilsons-snipe.jpg",
    markers: [
      "Stocky marsh bird with an extremely long, straight bill and short legs.",
      "Bold cream stripes run lengthwise across the dark head and back.",
      "Typically flushes from wet ground in a fast, twisting zigzag flight.",
    ],
    sourceUrl: "https://www.fws.gov/media/wilsons-snipe-0",
    credit: "Peter Pearsall / USFWS — Public Domain",
  },
];

const exactAliases: Array<[RegExp, string]> = [
  [/mallard.*drake/i, "mallard-drake"],
  [/mallard.*hen/i, "mallard-hen"],
  [/(american )?black duck/i, "american-black-duck"],
  [/(mottled|dusky) duck/i, "mottled-duck"],
  [/whistling/i, "black-bellied-whistling-duck"],
  [/wood duck/i, "wood-duck"],
  [/teal/i, "blue-winged-teal"],
  [/gadwall/i, "gadwall"],
  [/wigeon/i, "american-wigeon"],
  [/shoveler/i, "northern-shoveler"],
  [/pintail/i, "northern-pintail"],
  [/redhead/i, "redhead"],
  [/canvasback/i, "canvasback"],
  [/scaup/i, "scaup"],
  [/ring-necked/i, "ring-necked-duck"],
  [/bufflehead/i, "bufflehead"],
  [/goldeneye/i, "goldeneye"],
  [/merganser/i, "merganser"],
  [/harlequin/i, "harlequin-duck"],
  [/long-tailed/i, "long-tailed-duck"],
  [/scoter|sea duck/i, "scoter"],
  [/(canada|cackling).*goose/i, "canada-goose"],
  [/white-fronted/i, "white-fronted-goose"],
  [/(snow|blue|ross|light).*goose/i, "snow-goose"],
  [/brant/i, "brant"],
  [/(coot|moorhen)/i, "american-coot"],
  [/swan/i, "tundra-swan"],
  [/snipe/i, "wilsons-snipe"],
];

export function birdPhotoFor(bird: Pick<BirdRule, "label" | "group">) {
  const alias = exactAliases.find(([pattern]) => pattern.test(bird.label));
  const exact = alias ? birdGuideEntries.find((entry) => entry.id === alias[1]) : undefined;
  const isBroadRegulatoryCategory = /\/|other|sea duck|dark goose|early|september|bonus|closed|controlled|fulvous|dusky duck|hooded|pintail.*(drake|hen)/i.test(bird.label);
  if (exact) return { src: exact.image, alt: exact.name, representative: isBroadRegulatoryCategory };
  if (bird.group === "Geese") return { src: "/birds/canada-goose.jpg", alt: "Representative goose reference", representative: true };
  if (bird.group === "Other") return { src: "/birds/american-coot.jpg", alt: "Representative waterfowl reference", representative: true };
  return { src: "/birds/waterfowl-group.jpg", alt: "Representative duck reference", representative: true };
}
