export const titles = [
  {
    id: "orbit",
    name: "Last Orbit",
    genre: "Sci-fi",
    type: "Film",
    time: "112 min",
    score: 96,
    art: "orbit",
    synopsis:
      "A lone pilot follows a distress signal to a station that should have gone dark decades ago.",
  },
  {
    id: "neon",
    name: "Neon District",
    genre: "Thriller",
    type: "Film",
    time: "101 min",
    score: 94,
    art: "neon",
    synopsis:
      "A night-shift courier witnesses a disappearance in a city that records everything.",
  },
  {
    id: "north",
    name: "North of Silence",
    genre: "Mystery",
    type: "Film",
    time: "106 min",
    score: 92,
    art: "north",
    synopsis:
      "An isolated weather station receives a transmission from a team that never arrived.",
  },
  {
    id: "pines",
    name: "The Hollow Pines",
    genre: "Mystery",
    type: "Film",
    time: "98 min",
    score: 89,
    art: "pines",
    synopsis:
      "Estranged siblings return to a woodland estate where the rooms seem to change overnight.",
  },
  {
    id: "tide",
    name: "After the Tide",
    genre: "Drama",
    type: "Film",
    time: "109 min",
    score: 87,
    art: "tide",
    synopsis:
      "A coastal town reconnects after the sea returns an object lost a generation ago.",
  },
  {
    id: "signal",
    name: "Signal House",
    genre: "Sci-fi",
    type: "Series",
    time: "6 episodes",
    score: 86,
    art: "signal",
    synopsis:
      "An amateur radio club discovers a broadcast from the following day.",
  },
] as const;
export const genres = [...new Set(titles.map((title) => title.genre))];
