import type { Exhibit } from "./types";
import { pickSources } from "./sources";

// Text verbatim from docs/COPY.md §3–§4. [S#] markers are resolved into stats[].sourceId and sources[].
// Dropped per content-skill rules: see docs/PROGRESS.md (Spirit "unable to tilt its solar panels" clause).
export const exhibits: Exhibit[] = [
  {
    "slug": "moon-apollo-11",
    "catalogNo": "SM-L-001",
    "hall": "moon",
    "order": 1,
    "name": "Apollo 11",
    "formalName": "Apollo 11 Lunar Module Eagle (descent stage) & Laser Ranging Retroreflector",
    "type": "descent-stage",
    "agency": "NASA",
    "status": "still-active",
    "dates": {
      "landing": "1969-07-20"
    },
    "location": {
      "site": "Sea of Tranquility",
      "lat": 0.674,
      "lon": 23.473,
      "coordNote": "Position of the laser reflector, measured from LRO images",
      "coordSource": "NASA NSSDCA; NASA History Office catalogue (2012)"
    },
    "stats": [
      {
        "label": "Landed",
        "value": "20 Jul 1969",
        "sourceId": "S2"
      },
      {
        "label": "Reflector deployed",
        "value": "21 Jul 1969",
        "sourceId": "S3"
      },
      {
        "label": "Mirrors",
        "value": "100 corner-cube prisms (10 × 10)",
        "sourceId": "S3"
      },
      {
        "label": "Power needed",
        "value": "none",
        "sourceId": "S3"
      },
      {
        "label": "Samples returned",
        "value": "21.55 kg (47.51 lb)",
        "sourceId": "S4"
      }
    ],
    "plaque": "When Eagle's upper half blasted back to orbit, its lower half stayed behind as a launch pad — and it is still there. A few steps away sits a panel of 100 small mirrors. Scientists on Earth still bounce lasers off it today, making it the last working science experiment from the Apollo era.",
    "story": [
      "On 20 July 1969, the lunar module Eagle touched down on a dusty plain called the Sea of Tranquility. Neil Armstrong and Buzz Aldrin became the first people to walk on another world.",
      "Eagle was built in two parts. Its descent stage — an eight-sided body 4.2 meters across, standing on four legs — served as the launch platform for the ascent stage that carried the crew back to orbit. The descent stage was left behind.",
      "Before leaving, the crew set up a laser ranging retroreflector: 100 corner-cube prisms in a 10-by-10 grid that need no power at all. Observatories such as McDonald Observatory in Texas still aim lasers at the Apollo reflectors to measure the distance to the Moon."
    ],
    "discoveries": [
      "Brought home 21.55 kg (47.51 lb) of lunar rock and soil.",
      "Laser ranging to the Apollo reflectors is still used to study the Moon's motion and internal structure.",
      "Showed that a crew could land on the Moon, work outside, and launch home again."
    ],
    "whySilent": "Most of Eagle was never meant to keep working — the descent stage's last job was to be a launch pad. The reflector is the exception: it has no electronics, so it never went silent.",
    "youngExplorer": "The reflector works like the reflector on a bicycle: it sends light straight back to where it came from — even across 384,400 km of space.",
    "curatorNotes": "The Apollo 11, 14 and 15 reflectors are three of the five reflector arrays on the Moon; the other two travelled on Soviet Lunokhod rovers.",
    "vitrine": {
      "title": "Also left here",
      "items": [
        {
          "name": "A gold olive branch",
          "text": "",
          "sourceId": "S1"
        },
        {
          "name": "An Apollo 1 patch honoring astronauts Grissom, White and Chaffee",
          "text": "",
          "sourceId": "S1"
        },
        {
          "name": "Medals honoring cosmonauts Gagarin and Komarov",
          "text": "",
          "sourceId": "S1"
        },
        {
          "name": "A memorial disc",
          "text": "",
          "sourceId": "S1"
        }
      ]
    },
    "media": {
      "model": "/media/models/SM-L-001_apollo_lunar_module.web.glb",
      "fallbackImage": "/media/thennow/SM-L-001_then_as11-40-5948-1600.avif",
      "then": {
        "src": "/media/thennow/SM-L-001_then_as11-40-5948-1600.avif",
        "alt": "Buzz Aldrin beside the newly deployed experiments, with Eagle behind him. 20 July 1969.",
        "credit": "NASA"
      },
      "now": {
        "src": "/media/thennow/SM-L-001_now_PIA12909-1600.avif",
        "alt": "The Apollo 11 site seen from orbit by NASA's Lunar Reconnaissance Orbiter, 2009.",
        "credit": "NASA/GSFC/Arizona State University"
      }
    },
    "sources": pickSources(["S1","S2","S3","S4","S5","S6","S7","S45"]),
    "verified": true
  },
  {
    "slug": "moon-surveyor-3",
    "catalogNo": "SM-L-002",
    "hall": "moon",
    "order": 2,
    "name": "Surveyor 3",
    "formalName": "Surveyor 3 lunar lander",
    "type": "lander",
    "agency": "NASA/JPL",
    "status": "silent",
    "dates": {
      "launch": "1967-04-17",
      "landing": "1967-04-20"
    },
    "location": {
      "site": "Ocean of Storms (Oceanus Procellarum)",
      "lat": -3.015,
      "lon": -23.418,
      "coordNote": "Landing position, measured from LRO images",
      "coordSource": "NASA NSSDCA; NASA History Office catalogue (2012)"
    },
    "stats": [
      {
        "label": "Launched",
        "value": "17 Apr 1967",
        "sourceId": "S8"
      },
      {
        "label": "Landed",
        "value": "20 Apr 1967 (UTC)",
        "sourceId": "S8"
      },
      {
        "label": "Visited by",
        "value": "Apollo 12, November 1969",
        "sourceId": "S9"
      },
      {
        "label": "Distance to Apollo 12 lander",
        "value": "155 m",
        "sourceId": "S9"
      },
      {
        "label": "Parts brought home",
        "value": "camera and soil scoop",
        "sourceId": "S9"
      }
    ],
    "plaque": "Surveyor 3 landed alone in 1967. Two and a half years later, it had visitors. Apollo 12 set down just 155 meters away, and two astronauts walked over and took its camera home. It is the only time people have walked up to a robot they sent to another world.",
    "story": [
      "Before people could land on the Moon, NASA sent robotic Surveyor landers to study its surface. Surveyor 3 touched down in the Ocean of Storms on 20 April 1967.",
      "In November 1969, Apollo 12 landed just 155 meters away. On their second moonwalk, Pete Conrad and Alan Bean walked over to the old lander.",
      "They removed its camera and its soil scoop and carried them back to Earth, so scientists could study what two and a half years on the Moon does to a spacecraft."
    ],
    "discoveries": [
      "Photographed its landing site and dug into the lunar soil with its scoop.",
      "Its returned parts became a test of how spacecraft materials survive on the Moon.",
      "Gave Apollo 12 a precise target — and the crew landed within 155 meters of it."
    ],
    "whySilent": "Surveyor 3 was built for a short mission. By the time Apollo 12 arrived, it had been silent for a long time.",
    "youngExplorer": "Imagine landing on the Moon and finding a robot that had been waiting there for two and a half years. That happened in 1969.",
    "media": {
      "fallbackImage": "/media/thennow/SM-L-002_then_AS12-48-7134-1600.avif",
      "then": {
        "src": "/media/thennow/SM-L-002_then_AS12-48-7134-1600.avif",
        "alt": "Alan Bean with Surveyor 3; Apollo 12's lunar module stands in the background. November 1969.",
        "credit": "NASA"
      },
      "now": {
        "src": "/media/thennow/SM-L-002_now_PIA12922-1600.avif",
        "alt": "The Apollo 12 site from orbit, Lunar Reconnaissance Orbiter, 2009.",
        "credit": "NASA/GSFC/Arizona State University"
      }
    },
    "sources": pickSources(["S1","S8","S9"]),
    "verified": true
  },
  {
    "slug": "moon-apollo-15-lrv",
    "catalogNo": "SM-L-003",
    "hall": "moon",
    "order": 3,
    "name": "Apollo 15 Lunar Roving Vehicle",
    "formalName": "Lunar Roving Vehicle (LRV-1)",
    "type": "rover",
    "agency": "NASA (built by Boeing)",
    "status": "silent",
    "dates": {
      "landing": "1971-07-31"
    },
    "location": {
      "site": "Hadley–Apennine",
      "lat": 26.132,
      "lon": 3.634,
      "coordNote": "Apollo 15 landing site; the rover is parked about 150 m away",
      "coordSource": "NASA NSSDCA"
    },
    "stats": [
      {
        "label": "First drive on the Moon",
        "value": "31 Jul 1971",
        "sourceId": "S11"
      },
      {
        "label": "Distance driven",
        "value": "27.9 km (17 mi)",
        "sourceId": "S12"
      },
      {
        "label": "Rovers built",
        "value": "4 (3 are on the Moon)",
        "sourceId": "S10"
      },
      {
        "label": "Final program cost",
        "value": "$38 million",
        "sourceId": "S10"
      },
      {
        "label": "Objects left by the Apollo 15 crew",
        "value": "189",
        "sourceId": "S13"
      }
    ],
    "plaque": "The first car on the Moon. Apollo 15's rover carried Dave Scott and Jim Irwin 27.9 km across the Hadley–Apennine region — far beyond where they could walk. Before leaving, Scott parked it about 150 meters away, its TV camera aimed so people on Earth could watch the liftoff live.",
    "story": [
      "The Lunar Roving Vehicle was an electric car designed for the Moon's low gravity and airless vacuum.",
      "On 31 July 1971, Apollo 15 astronauts made the first drive on another world. Over three moonwalks they drove 27.9 km, exploring the foot of the Apennine Mountains and the edge of Hadley Rille.",
      "At the end, Scott parked the rover about 500 feet (150 m) from the lander, where its TV camera could broadcast their liftoff. For the first time, Mission Control and viewers on Earth watched a lunar liftoff live."
    ],
    "discoveries": [
      "Helped the crew collect the \"Genesis Rock,\" made almost entirely of plagioclase feldspar — a piece of the Moon's most ancient crust.",
      "Proved a vehicle could multiply how far astronauts could explore.",
      "Apollo 15 also left a laser reflector with 300 corner cubes, still used today."
    ],
    "whySilent": "It was never meant to come home. Every kilogram returned to Earth had to be launched off the Moon, so the rover stayed behind with the lander's descent stage.",
    "youngExplorer": "Four of these rovers were built. Three are still on the Moon. The fourth was used for spare parts.",
    "vitrine": {
      "title": "Also left here",
      "items": [
        {
          "name": "The Fallen Astronaut sculpture and plaque",
          "text": "",
          "sourceId": "S1"
        },
        {
          "name": "A Bible left on the rover's dashboard by Jim Irwin",
          "text": "",
          "sourceId": "S1"
        },
        {
          "name": "The hammer and feather from a famous gravity demonstration",
          "text": "",
          "sourceId": "S1"
        },
        {
          "name": "Elsewhere: Charlie Duke left a family photograph at the Apollo 16 site.",
          "text": "",
          "sourceId": "S17"
        }
      ]
    },
    "media": {
      "fallbackImage": "/media/thennow/SM-L-003_then_as15-88-11901-1600.avif",
      "then": {
        "src": "/media/thennow/SM-L-003_then_as15-88-11901-1600.avif",
        "alt": "The Apollo 15 rover against the lunar mountains, 1 August 1971.",
        "credit": "NASA"
      },
      "now": {
        "src": "/media/thennow/SM-L-003_now_GSFC_20171208_Archive_e001054-1600.avif",
        "alt": "LRO's view over Hadley Rille and Mount Hadley, the Apollo 15 landing region.",
        "credit": "NASA/GSFC/Arizona State University"
      }
    },
    "sources": pickSources(["S1","S6","S10","S11","S12","S13","S14","S15","S16","S17"]),
    "verified": true
  },
  {
    "slug": "moon-apollo-17",
    "catalogNo": "SM-L-004",
    "hall": "moon",
    "order": 4,
    "name": "Apollo 17",
    "formalName": "Apollo 17 Lunar Module Challenger (descent stage), rover and experiments",
    "type": "descent-stage",
    "agency": "NASA",
    "status": "silent",
    "dates": {
      "landing": "1972-12-11"
    },
    "location": {
      "site": "Taurus–Littrow valley",
      "lat": 20.1667,
      "lon": 30.7667,
      "coordNote": "Apollo 17 landing site",
      "coordSource": "NASA NSSDCA"
    },
    "stats": [
      {
        "label": "Landed",
        "value": "11 Dec 1972",
        "sourceId": "S18"
      },
      {
        "label": "Samples returned",
        "value": "110.5 kg",
        "sourceId": "S19"
      },
      {
        "label": "Status",
        "value": "the last crewed Moon landing (as of 2026)",
        "sourceId": "S18"
      }
    ],
    "plaque": "In December 1972, Gene Cernan and Harrison Schmitt explored the valley of Taurus–Littrow. When they left, they left their lander's base, their rover, their experiments — and the last human footprints on the Moon. Cameras in orbit can still see the rover tracks today.",
    "story": [
      "Apollo 17 landed on 11 December 1972 in a valley ringed by mountains, called Taurus–Littrow.",
      "At one stop, the crew found soil that was bright orange. It turned out to be made almost entirely of tiny beads of orange glass.",
      "Apollo 17 remains the last time people walked on the Moon. In April 2026, Artemis II astronauts flew around the Moon — but did not land."
    ],
    "discoveries": [
      "Collected the orange soil — almost entirely orange glass.",
      "Brought home 110.5 kg of samples.",
      "Orbital images from LRO still show its rover tracks and footprints."
    ],
    "whySilent": "The descent stage stayed as a launch pad, and the rover stayed because there was no way to bring it home.",
    "youngExplorer": "With no wind or rain on the Moon, footprints there can last a very long time.",
    "media": {
      "model": "/media/models/SM-L-001_apollo_lunar_module.web.glb",
      "fallbackImage": "/media/thennow/SM-L-004_then_as17-147-22526-1600.avif",
      "then": {
        "src": "/media/thennow/SM-L-004_then_as17-147-22526-1600.avif",
        "alt": "Gene Cernan drives the rover during the first Apollo 17 moonwalk.",
        "credit": "NASA"
      },
      "now": {
        "src": "/media/thennow/SM-L-004_now_LRO-apollo17-litho-1600.avif",
        "alt": "The Apollo 17 site from orbit: descent stage, rover tracks and footprints.",
        "credit": "NASA/GSFC/Arizona State University"
      }
    },
    "sources": pickSources(["S18","S19","S20","S21","S42"]),
    "verified": true
  },
  {
    "slug": "moon-grail",
    "catalogNo": "SM-L-005",
    "hall": "moon",
    "order": 5,
    "name": "GRAIL — Ebb & Flow",
    "formalName": "Gravity Recovery and Interior Laboratory (GRAIL-A \"Ebb\" & GRAIL-B \"Flow\")",
    "type": "impact-site",
    "agency": "NASA/JPL",
    "status": "silent",
    "statusLabel": "IMPACT SITE",
    "dates": {
      "landing": "2012-12-17"
    },
    "location": {
      "site": "Sally K. Ride Impact Site, near Goldschmidt crater, north polar region",
      "lat": 75.609,
      "lon": -26.593,
      "coordNote": "Ebb's impact crater; Flow's lies about 2.2 km away at 75.651°N 26.832°W",
      "coordSource": "LROC, Arizona State University / NASA, 19 Mar 2013"
    },
    "stats": [
      {
        "label": "Impact",
        "value": "17 Dec 2012",
        "sourceId": "S22"
      },
      {
        "label": "Craters",
        "value": "about 5 m wide each",
        "sourceId": "S23"
      },
      {
        "label": "Moon's average crust thickness measured",
        "value": "34 to 43 km",
        "sourceId": "S24"
      }
    ],
    "plaque": "Ebb and Flow were twin spacecraft that flew one behind the other around the Moon, mapping its gravity. At the end of their mission in December 2012, NASA steered them into a mountain near the north pole on purpose. The site is named for Sally Ride, America's first woman in space.",
    "story": [
      "By measuring tiny changes in the distance between them, the twins mapped the Moon's gravity in extraordinary detail.",
      "They found the Moon's crust is 34 to 43 km thick on average — 10 to 20 km thinner than previously thought — and full of cracks and pores.",
      "On 17 December 2012 the twins hit a mountain near the north pole. NASA named the site after Sally Ride, who led the mission's MoonKAM education program."
    ],
    "discoveries": [
      "The highest-resolution gravity map of any world.",
      "A thinner crust than expected: 34–43 km on average.",
      "Highland crust that is less dense and more porous than assumed."
    ],
    "whySilent": "On purpose. The mission ended with a planned impact.",
    "youngExplorer": "The craters Ebb and Flow made are only about 5 meters wide — about the length of a car.",
    "media": {
      "fallbackImage": "/media/thennow/SM-L-005_then_PIA13965-1600.avif",
      "then": {
        "src": "/media/thennow/SM-L-005_then_PIA13965-1600.avif",
        "alt": "Artist's concept of the twin GRAIL spacecraft, Ebb and Flow, orbiting the Moon.",
        "credit": "Artist's concept · NASA/JPL-Caltech/MIT"
      },
      "now": {
        "src": "/media/thennow/SM-L-005_now_GRAIL_impacts_before_after-1600.avif",
        "alt": "Before and after: LRO images of the two impact sites.",
        "credit": "NASA/GSFC/Arizona State University"
      }
    },
    "sources": pickSources(["S22","S23","S24"]),
    "verified": true
  },
  {
    "slug": "mars-viking-1",
    "catalogNo": "SM-M-001",
    "hall": "mars",
    "order": 1,
    "name": "Viking 1 Lander",
    "formalName": "Viking 1 Lander (Thomas A. Mutch Memorial Station)",
    "type": "lander",
    "agency": "NASA",
    "status": "silent",
    "dates": {
      "landing": "1976-07-20",
      "lastContact": "1982-11",
      "missionEnd": "1983-05-21"
    },
    "location": {
      "site": "Chryse Planitia",
      "lat": 22.27,
      "lon": -47.95,
      "coordNote": "Landing site",
      "coordSource": "NASA NSSDCA, planetocentric"
    },
    "stats": [
      {
        "label": "Landed",
        "value": "20 Jul 1976",
        "sourceId": "S25"
      },
      {
        "label": "Last transmission",
        "value": "Nov 1982",
        "sourceId": "S26"
      },
      {
        "label": "Mission ended",
        "value": "21 May 1983",
        "sourceId": "S26"
      },
      {
        "label": "Images from both Viking landers",
        "value": "more than 1,400",
        "sourceId": "S26"
      }
    ],
    "plaque": "The first American spacecraft to land on Mars. Minutes after touching down on 20 July 1976, Viking 1 photographed its own footpad resting on Martian soil. It kept working for more than six years, reporting the weather and testing the soil for signs of life.",
    "story": [
      "Viking 1 was meant to land on 4 July 1976, America's 200th birthday. Orbital photos showed the chosen site was too rough, so the team searched for a safer one — and landed more than two weeks later.",
      "Its first photograph, taken just minutes after landing, showed one of its footpads on the rocky ground of Chryse Planitia.",
      "For more than six years it measured the weather, studied the soil and sent pictures home, until its final transmission in November 1982."
    ],
    "discoveries": [
      "A cold, dry world: between about −86 °C and −30 °C the day after landing.",
      "Soil with almost 100 times as much sulfur as soil on Earth or the Moon.",
      "Biology experiments found unexpected chemistry in the soil, but no definitive evidence of life."
    ],
    "whySilent": "Its final transmission came in November 1982. Engineers tried for about six and a half months to regain contact before the mission ended in May 1983.",
    "youngExplorer": "Viking 1's very first picture from Mars was of its own foot.",
    "media": {
      "model": "/media/models/SM-M-001_viking_lander.web.glb",
      "fallbackImage": "/media/thennow/SM-M-001_then_PIA00381-1600.avif",
      "then": {
        "src": "/media/thennow/SM-M-001_then_PIA00381-1600.avif",
        "alt": "The first photograph taken on the surface of Mars, 20 July 1976.",
        "credit": "NASA/JPL"
      },
      "now": {
        "src": "/media/thennow/SM-M-001_now_PIA01881-1600.avif",
        "alt": "Viking 1 seen from orbit by HiRISE, 2006.",
        "credit": "NASA/JPL-Caltech/University of Arizona"
      }
    },
    "sources": pickSources(["S25","S26","S27"]),
    "verified": true
  },
  {
    "slug": "mars-pathfinder",
    "catalogNo": "SM-M-002",
    "hall": "mars",
    "order": 2,
    "name": "Mars Pathfinder & Sojourner",
    "formalName": "Mars Pathfinder lander (Carl Sagan Memorial Station) and Sojourner rover",
    "type": "lander",
    "agency": "NASA/JPL",
    "status": "silent",
    "dates": {
      "launch": "1996-12-04",
      "landing": "1997-07-04",
      "lastContact": "1997-09-27",
      "missionEnd": "1998-03-10"
    },
    "location": {
      "site": "Ares Vallis",
      "lat": 19.33,
      "lon": -33.55,
      "coordNote": "Landing site",
      "coordSource": "NASA NSSDCA"
    },
    "stats": [
      {
        "label": "Launched",
        "value": "4 Dec 1996",
        "sourceId": "S28"
      },
      {
        "label": "Landed",
        "value": "4 Jul 1997",
        "sourceId": "S28"
      },
      {
        "label": "Planned mission",
        "value": "7 days · Actual — 83 days",
        "sourceId": "S29"
      },
      {
        "label": "Images from the lander",
        "value": "more than 16,000",
        "sourceId": "S30"
      },
      {
        "label": "Final data",
        "value": "27 Sep 1997",
        "sourceId": "S29"
      }
    ],
    "plaque": "Pathfinder reached Mars on 4 July 1997 wrapped in airbags, bouncing across the ground before rolling to a stop. Out drove Sojourner, NASA's first Mars rover. The mission was planned to last a week. It lasted 83 days.",
    "story": [
      "Pathfinder landed inside a cocoon of airbags and bounced until it came to rest in Ares Vallis, an ancient flood plain.",
      "Sojourner rolled down a ramp and drove from rock to rock, measuring what they were made of.",
      "The lander was renamed the Carl Sagan Memorial Station, honoring the astronomer who had died the year before."
    ],
    "discoveries": [
      "More than 16,000 images from the lander and about 550 from the rover.",
      "Wind had stripped away several centimeters of material from the surface.",
      "Clues that Mars was once warmer and wetter, with liquid water and a thicker atmosphere."
    ],
    "whySilent": "The last data arrived on 27 September 1997. Engineers tried for about five months to restore contact before the mission formally ended on 10 March 1998.",
    "youngExplorer": "Pathfinder landed by bouncing — like a giant beach ball.",
    "media": {
      "fallbackImage": "/media/thennow/SM-M-002_then_PIA00614-1600.avif",
      "then": {
        "src": "/media/thennow/SM-M-002_then_PIA00614-1600.avif",
        "alt": "Deflated airbags and Sojourner on the lander, July 1997.",
        "credit": "NASA/JPL"
      },
      "now": {
        "src": "/media/thennow/SM-M-002_now_PIA09105-1600.avif",
        "alt": "The Pathfinder landing site and surroundings from orbit, HiRISE, 2007.",
        "credit": "NASA/JPL-Caltech/University of Arizona"
      }
    },
    "sources": pickSources(["S28","S29","S30"]),
    "verified": true
  },
  {
    "slug": "mars-spirit",
    "catalogNo": "SM-M-003",
    "hall": "mars",
    "order": 3,
    "name": "Spirit",
    "formalName": "Mars Exploration Rover A (MER-A) \"Spirit\"",
    "type": "rover",
    "agency": "NASA/JPL",
    "status": "silent",
    "dates": {
      "landing": "2004-01-04",
      "lastContact": "2010-03-22",
      "missionEnd": "2011-05-25"
    },
    "location": {
      "site": "Gusev Crater → Home Plate, \"Troy\"",
      "lat": -14.572,
      "lon": 175.478,
      "coordNote": "Landing site; Spirit later drove to Home Plate and stopped at Troy",
      "coordSource": "NASA NSSDCA"
    },
    "stats": [
      {
        "label": "Landed",
        "value": "4 Jan 2004",
        "sourceId": "S31"
      },
      {
        "label": "Distance driven",
        "value": "7.7 km (4.8 mi)",
        "sourceId": "S32"
      },
      {
        "label": "Stuck at \"Troy\"",
        "value": "May 2009",
        "sourceId": "S33"
      },
      {
        "label": "Last contact",
        "value": "22 Mar 2010",
        "sourceId": "S34"
      },
      {
        "label": "Mission ended",
        "value": "25 May 2011",
        "sourceId": "S34"
      }
    ],
    "plaque": "Spirit landed in Gusev Crater in January 2004 and explored for six years. In 2007 it uncovered bright soil that was about 90% silica — a sign that water, perhaps volcanic steam, once soaked this ground. In 2009 it became trapped in soft sand at a place called Troy, and kept doing science where it stood.",
    "story": [
      "Spirit landed on 4 January 2004, three weeks before its twin, Opportunity. It crossed the plains of Gusev Crater and climbed into the Columbia Hills.",
      "In 2007 it uncovered a patch of soil about 90% silica. Making that much silica needs water — possibly acidic steam from volcanic activity.",
      "In May 2009 its wheels sank into soft soil beside Home Plate, at a site the team called Troy. Unable to drive free, Spirit kept working as a stationary science station."
    ],
    "discoveries": [
      "Soil about 90% silica — evidence of past water.",
      "A long record of the Columbia Hills, including a climb up Husband Hill.",
      "Science from a standstill: studying the soil it was stuck in."
    ],
    "whySilent": "Stuck in soft soil, Spirit faced a hard Martian winter. The most probable cause of the loss of contact was extreme cold that made its survival heaters ineffective. More than 1,300 commands went unanswered.",
    "youngExplorer": "By the end, Spirit was driving with only five working wheels.",
    "media": {
      "model": "/media/models/SM-M-003-004_mer_spirit_opportunity.web.glb",
      "fallbackImage": "/media/thennow/SM-M-003_then_PIA05040-1600.avif",
      "then": {
        "src": "/media/thennow/SM-M-003_then_PIA05040-1600.avif",
        "alt": "Spirit stretches out on its lander, January 2004.",
        "credit": "NASA/JPL"
      },
      "now": {
        "src": "/media/thennow/SM-M-003_now_PIA12205-1600.avif",
        "alt": "Spirit at Troy, seen from orbit by HiRISE, 2009.",
        "credit": "NASA/JPL-Caltech/University of Arizona"
      }
    },
    "sources": pickSources(["S31","S32","S33","S34","S35","S36","S37","S38","S39"]),
    "verified": true
  },
  {
    "slug": "mars-opportunity",
    "catalogNo": "SM-M-004",
    "hall": "mars",
    "order": 4,
    "name": "Opportunity",
    "formalName": "Mars Exploration Rover B (MER-B) \"Opportunity\"",
    "type": "rover",
    "agency": "NASA/JPL",
    "status": "silent",
    "dates": {
      "landing": "2004-01-24",
      "lastContact": "2018-06-10",
      "missionEnd": "2019-02-13"
    },
    "location": {
      "site": "Meridiani Planum → Endeavour Crater",
      "lat": -1.946,
      "lon": -5.527,
      "coordNote": "Landing site; Opportunity later drove 45.16 km to Endeavour Crater",
      "coordSource": "NASA NSSDCA, IAU 2000"
    },
    "stats": [
      {
        "label": "Landed",
        "value": "24 Jan 2004",
        "sourceId": "S47"
      },
      {
        "label": "Designed for",
        "value": "90 sols (Martian days)",
        "sourceId": "S47"
      },
      {
        "label": "Distance driven",
        "value": "45.16 km (28.06 mi)",
        "sourceId": "S48"
      },
      {
        "label": "Last contact",
        "value": "10 Jun 2018 (sol 5111)",
        "sourceId": "S48"
      },
      {
        "label": "Mission ended",
        "value": "13 Feb 2019",
        "sourceId": "S48"
      }
    ],
    "plaque": "Opportunity was built to last 90 Martian days. It kept going for more than 14 years and drove 45.16 km — longer than a marathon. Along the way it found tiny iron-rich spheres nicknamed \"blueberries\" and mineral veins laid down by water long ago.",
    "story": [
      "Opportunity landed on 24 January 2004 on the flat plains of Meridiani Planum. It was designed for a 90-sol mission.",
      "It became the first rover to identify and study sedimentary rocks on another planet, and found hematite \"blueberries\" formed by acidic groundwater.",
      "At Endeavour Crater it found veins of gypsum and clay minerals formed in water friendly enough for ancient microbes."
    ],
    "discoveries": [
      "Hematite \"blueberries\" — a sign that liquid water once soaked these rocks.",
      "Gypsum veins deposited by water.",
      "Clays formed in neutral water — the friendliest conditions for ancient life it studied."
    ],
    "whySilent": "In June 2018 a dust storm wrapped the entire planet. With sunlight blocked from its solar panels, Opportunity's power dropped too low to talk to Earth. More than 1,000 commands to restore contact went unanswered.",
    "youngExplorer": "Opportunity's odometer passed 42.195 km in 2015. It ran a marathon on Mars.",
    "curatorNotes": "A widely shared line — \"My battery is low and it's getting dark\" — is a journalist's paraphrase of the rover's final data, not a message the rover sent. Its real final transmission is shown here as data.",
    "media": {
      "model": "/media/models/SM-M-003-004_mer_spirit_opportunity.web.glb",
      "fallbackImage": "/media/thennow/SM-M-004_then_PIA17759-1600.avif",
      "then": {
        "src": "/media/thennow/SM-M-004_then_PIA17759-1600.avif",
        "alt": "Self-portrait, January 2014.",
        "credit": "NASA/JPL-Caltech/Cornell Univ./Arizona State Univ."
      },
      "now": {
        "src": "/media/thennow/SM-M-004_now_PIA22549-1600.avif",
        "alt": "Opportunity after the dust storm, seen by HiRISE, 2018.",
        "credit": "NASA/JPL-Caltech/University of Arizona"
      },
      "extra": [
        {
          "src": "/media/thennow/SM-M-004_then-lastmessage_PIA22929-1600.avif",
          "alt": "Opportunity's last image, 2018.",
          "credit": "NASA/JPL-Caltech/Cornell/ASU"
        }
      ]
    },
    "sources": pickSources(["S47","S48","S49","S50","S51","S52"]),
    "verified": true
  },
  {
    "slug": "mars-phoenix",
    "catalogNo": "SM-M-005",
    "hall": "mars",
    "order": 5,
    "name": "Phoenix",
    "formalName": "Phoenix Mars Lander",
    "type": "lander",
    "agency": "NASA/JPL",
    "status": "silent",
    "dates": {
      "landing": "2008-05-25",
      "lastContact": "2008-11-02",
      "missionEnd": "2010-05-24"
    },
    "location": {
      "site": "\"Green Valley,\" Vastitas Borealis — the northernmost landing on Mars",
      "lat": 68.219,
      "lon": -125.749,
      "coordNote": "Landing site",
      "coordSource": "NASA PDS Geosciences Node, IAU 2000"
    },
    "stats": [
      {
        "label": "Landed",
        "value": "25 May 2008",
        "sourceId": "S53"
      },
      {
        "label": "Last signal",
        "value": "2 Nov 2008",
        "sourceId": "S53"
      },
      {
        "label": "Mission formally ended",
        "value": "24 May 2010",
        "sourceId": "S54"
      }
    ],
    "plaque": "Phoenix landed farther north than any spacecraft before it, and dug into the Martian Arctic. It confirmed water ice just below the surface and watched snow fall from the clouds. Then the long polar winter came. Images from orbit later showed its solar panels damaged, probably by the weight of frozen carbon dioxide.",
    "story": [
      "Phoenix touched down on 25 May 2008 in the far north of Mars.",
      "Its robotic arm dug trenches. Bright clumps in the soil vanished after four days — water ice turning to vapor.",
      "A laser instrument pointed at the sky detected snow falling from clouds about 4 km up. The snow vaporized before reaching the ground."
    ],
    "discoveries": [
      "Water ice just beneath the surface.",
      "Perchlorate in the soil — the mission's biggest surprise, a salt that strongly attracts water.",
      "Snow falling from Martian clouds."
    ],
    "whySilent": "As winter arrived, sunlight faded and its solar panels could not make enough power. Phoenix sent its last signal on 2 November 2008. In 2010, the orbiter Odyssey listened during 61 passes and heard nothing.",
    "youngExplorer": "Phoenix saw snow on Mars — but the flakes disappeared before they reached the ground.",
    "media": {
      "fallbackImage": "/media/thennow/SM-M-005_then_PIA11719-1600.avif",
      "then": {
        "src": "/media/thennow/SM-M-005_then_PIA11719-1600.avif",
        "alt": "Phoenix self-portrait on the Martian Arctic plains, 2008.",
        "credit": "NASA/JPL-Caltech/University of Arizona/Texas A&M University"
      },
      "now": {
        "src": "/media/thennow/SM-M-005_now_PIA22223-1600.avif",
        "alt": "Phoenix seen from orbit nearly a decade later, HiRISE, 2018.",
        "credit": "NASA/JPL-Caltech/University of Arizona"
      }
    },
    "sources": pickSources(["S53","S54","S55"]),
    "verified": true
  },
  {
    "slug": "mars-insight",
    "catalogNo": "SM-M-006",
    "hall": "mars",
    "order": 6,
    "name": "InSight",
    "formalName": "Interior Exploration using Seismic Investigations, Geodesy and Heat Transport (InSight)",
    "type": "lander",
    "agency": "NASA/JPL",
    "status": "silent",
    "dates": {
      "landing": "2018-11-26",
      "lastContact": "2022-12",
      "missionEnd": "2022-12-21"
    },
    "location": {
      "site": "Elysium Planitia",
      "lat": 4.5,
      "lon": 135.9,
      "coordNote": "Landing site",
      "coordSource": "NASA JPL"
    },
    "stats": [
      {
        "label": "Landed",
        "value": "26 Nov 2018",
        "sourceId": "S56"
      },
      {
        "label": "Marsquakes detected",
        "value": "1,319",
        "sourceId": "S57"
      },
      {
        "label": "Largest",
        "value": "magnitude 5 (May 2022)",
        "sourceId": "S57"
      },
      {
        "label": "Mission ended",
        "value": "21 Dec 2022",
        "sourceId": "S57"
      }
    ],
    "plaque": "InSight didn't drive anywhere. It sat still and listened. Its seismometer felt 1,319 marsquakes, letting scientists map the inside of the planet. Year by year, dust settled on its solar panels — until there was no longer enough power to keep listening.",
    "story": [
      "InSight landed on 26 November 2018 on Elysium Planitia, a flat, safe plain chosen because its job was to study the inside of Mars, not the surface.",
      "It placed a seismometer on the ground and recorded 1,319 marsquakes. The largest, magnitude 5, struck in May 2022.",
      "Quake waves revealed the layers of Mars: a crust about 25 to 40 km thick under the lander, and a molten core larger than expected."
    ],
    "discoveries": [
      "1,319 marsquakes, many from a region called Cerberus Fossae.",
      "A crust about 25–40 km thick beneath the lander, in three layers.",
      "A liquid core about 1,800 km in radius."
    ],
    "whySilent": "Dust slowly covered its solar panels. When the team failed to reach it twice in a row, they concluded its batteries had run out. NASA retired the mission on 21 December 2022.",
    "youngExplorer": "InSight took selfies. Compare its first and last ones and you can watch Mars dust slowly bury it.",
    "media": {
      "model": "/media/models/SM-M-006_insight_panels_deployed.web.glb",
      "fallbackImage": "/media/thennow/SM-M-006_then_PIA22876-1600.avif",
      "then": {
        "src": "/media/thennow/SM-M-006_then_PIA22876-1600.avif",
        "alt": "InSight's first selfie, December 2018.",
        "credit": "NASA/JPL-Caltech"
      },
      "now": {
        "src": "/media/thennow/SM-M-006_now_PIA23376-1600.avif",
        "alt": "InSight from orbit, HiRISE, 2019.",
        "credit": "NASA/JPL-Caltech/University of Arizona"
      },
      "extra": [
        {
          "src": "/media/thennow/SM-M-006_then-final_PIA25287-1600.avif",
          "alt": "Its final selfie, 2022.",
          "credit": "NASA/JPL-Caltech"
        }
      ]
    },
    "sources": pickSources(["S56","S57","S58","S59"]),
    "verified": true
  },
  {
    "slug": "mars-ingenuity",
    "catalogNo": "SM-M-007",
    "hall": "mars",
    "order": 7,
    "name": "Ingenuity",
    "formalName": "Ingenuity Mars Helicopter",
    "type": "helicopter",
    "agency": "NASA/JPL",
    "status": "silent",
    "dates": {
      "landing": "2021-04-19",
      "lastContact": "2024-01-18",
      "missionEnd": "2024-01-25"
    },
    "location": {
      "site": "Jezero Crater → \"Valinor Hills\"",
      "coordNote": "Exact final position not published; it rests at Valinor Hills in Jezero Crater",
      "coordSource": "NASA JPL"
    },
    "stats": [
      {
        "label": "First flight",
        "value": "19 Apr 2021, 39.1 seconds",
        "sourceId": "S61"
      },
      {
        "label": "Flights planned",
        "value": "up to 5 · Flights flown — 72",
        "sourceId": "S62"
      },
      {
        "label": "Last flight",
        "value": "18 Jan 2024",
        "sourceId": "S62"
      },
      {
        "label": "Mission ended",
        "value": "25 Jan 2024",
        "sourceId": "S62"
      }
    ],
    "plaque": "The first aircraft to make a powered, controlled flight on another planet. Ingenuity was built to try up to five flights. It flew 72. Tucked beneath its solar panel it carried a small piece of fabric from the Wright brothers' 1903 Flyer.",
    "story": [
      "On 19 April 2021, Ingenuity rose into the thin air of Mars for 39.1 seconds, at a spot the team named Wright Brothers Field.",
      "It became a scout for the Perseverance rover, flying 72 times over nearly three years.",
      "On its 72nd flight, smooth, featureless ground confused its navigation system; a rough landing damaged its rotor blades, ending its flying days."
    ],
    "discoveries": [
      "Powered flight is possible in Mars's thin atmosphere.",
      "Aerial scouting can guide a rover's path.",
      "On flight 26 it photographed the parachute and backshell that had carried Perseverance to the surface."
    ],
    "whySilent": "After its final flight on 18 January 2024 damaged its rotor blades, NASA ended the mission on 25 January 2024.",
    "youngExplorer": "The first powered flight on Earth (1903) and the first on Mars (2021) are linked by a scrap of fabric.",
    "vitrine": {
      "title": "The Debris Field",
      "items": [
        {
          "name": "The parachute and backshell",
          "text": "On 19 April 2022 — one year after its first flight — Ingenuity photographed Perseverance's parachute and cone-shaped backshell from 8 meters up.",
          "sourceId": "S63"
        },
        {
          "name": "Hardware on Mars",
          "text": "Researcher Cagri Kilic (West Virginia University) estimated in 2022 that about 7,119 kg of human hardware now lies on Mars — an independent estimate, not a NASA figure.",
          "sourceId": "S65"
        }
      ]
    },
    "media": {
      "model": "/media/models/SM-M-007_ingenuity.web.glb",
      "fallbackImage": "/media/thennow/SM-M-007_then-alt_PIA26236-1600.avif",
      "then": {
        "src": "/media/thennow/SM-M-007_then-alt_PIA26236-1600.avif",
        "alt": "Perseverance spots Ingenuity at its final airfield, 2024.",
        "credit": "NASA/JPL-Caltech/ASU/MSSS"
      },
      "now": {
        "src": "/media/thennow/SM-M-007_now_PIA25174-1600.avif",
        "alt": "HiRISE spots Perseverance and Ingenuity, 2022.",
        "credit": "NASA/JPL-Caltech/University of Arizona"
      }
    },
    "sources": pickSources(["S60","S61","S62","S63","S64","S65"]),
    "verified": true
  }
];

export const exhibitBySlug = (slug: string) => exhibits.find((e) => e.slug === slug);
export const exhibitsByHall = (hall: "moon" | "mars") => exhibits.filter((e) => e.hall === hall).sort((a, b) => a.order - b.order);
