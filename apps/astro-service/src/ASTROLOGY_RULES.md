# Astrology Rules & Conventions

This document summarizes the astrological rules and conventions followed in the astro-service so that calculations align with standard (Vedic and Western) practice.

## Vedic (Sidereal) Chart

- **Ayanamsa**: Lahiri (default). Tropical longitudes are converted to sidereal by subtracting the Lahiri ayanamsa.
- **Houses**: Placidus (same as Western); house cusps and ascendant are computed in tropical space then converted to sidereal.
- **Retrograde**: A planet is retrograde when its longitudinal speed is negative (`speed < 0`). Only Mercury, Venus, Mars, Jupiter, and Saturn can be retrograde; Sun and Moon are never retrograde.
- **Rahu & Ketu**: Rahu = North Lunar Node (Mean Node); Ketu = South Lunar Node = (Rahu longitude + 180°). Ketu’s latitude/speed are set as opposite of Rahu for chart display.
- **Nakshatra**: 27 equal divisions of 360° (13°20' each); 4 padas per nakshatra (3°20'). Longitude is normalized to [0, 360) before computing index and pada.

## Vimshottari Dasha

- **Cycle**: 120 years (Ketu 7, Venus 20, Sun 6, Moon 10, Mars 7, Rahu 18, Jupiter 16, Saturn 19, Mercury 17).
- **Start**: The mahadasha running at birth is determined by the Moon’s nakshatra ruler (NAKSHATRA_PLANET_MAP). The start date of that mahadasha is computed from birth date and nakshatra progress.
- **Current dasha**: Iteration runs from the birth mahadasha planet (not from Ketu), so the sequence of mahadashas and antardashas is correct.
- **Antardasha**: Duration = (Mahadasha years × Planet years) / 120 (in days).

## Divisional Charts (D-charts)

- **Formula**: Divisional longitude = (sidereal longitude × divisor) % 360. Same divisor applied to lagna, planets, and house cusps.
- **Supported**: D-1 (Lagna), D-9 (Navamsa), D-7, D-10, D-12, D-16, D-20, D-24, D-30.

## Compatibility (Guna Milan)

- **Ashtakoot**: Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot, Nadi — weights and rules as in `compatibility.constants.ts` and `astrology.constants.ts`.
- **Nadi dosha**: Same nakshatra Nadi group (Vata/Pitta/Kapha) for both Moons.
- **Manglik**: Mars in Aries, Scorpio, or Capricorn; and in houses 1, 4, 7, 8, or 12 (see MANGLIK_SIGNS, MANGLIK_HOUSES).

## Transits & Retrogrades

- **Retrograde planets**: Mercury, Venus, Mars, Jupiter, Saturn only. Detection via Swiss Ephemeris longitudinal speed < 0.
- **Single-day retrogrades**: Computed for noon UTC at the given location (or default Delhi) for the requested date.

## Western Chart

- **System**: Tropical; Placidus houses. Same Swiss Ephemeris positions; no ayanamsa. Retrograde still shown via `speed < 0` for the five planets above.
