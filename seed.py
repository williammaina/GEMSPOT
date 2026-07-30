"""
GemSpot KE seeder — UNIQUE real places only
=============================================
- Unique real Kenyan venues (no numbered clones)
- Accurate matatu / access directions
- Real Unsplash image URLs (no picsum)

Run after flask db upgrade:
    flask seed
"""

from __future__ import annotations

import random
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path

from extensions import db
from models.user import User
from models.category import Category, Tag
from models.place import Place, PlaceImage
from models.event import Event
from models.vibe_check import VibeCheck

RANDOM_SEED = 42
DROP_AND_RECREATE = False

PLACES_DATA = {'nature': [{'name': 'Karura Forest — Limuru Road Gate (Gate A)', 'town': 'Karura', 'county': 'Nairobi', 'lat': -1.2443, 'lng': 36.8288, 'address': 'Limuru Road, opposite Belgian Embassy, Nairobi', 'matatu': 'Matatu 11B, 106, 107 or 116 from CBD/Odeon toward Limuru Rd; alight Belgian Embassy / Gate A', 'desc': 'Urban forest trails, waterfall, caves and picnic spots. Open 6am–6pm; last entry ~5:45pm.', 'price_level': 'Budget', 'damage': 500, 'gate': 'Citizen ~KES 100–174; Non-resident higher', 'indoor': False, 'wifi': False, 'sockets': False, 'pets': True, 'parking': True, 'dress': 'Comfortable outdoor; closed shoes', 'hours': '06:00 AM - 06:00 PM', 'image': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80'}, {'name': 'Karura Forest — Kiambu Road Gate (Gate C / Sharks)', 'town': 'Karura', 'county': 'Nairobi', 'lat': -1.239, 'lng': 36.812, 'address': 'Kiambu Road, opposite DCI HQ area, Nairobi', 'matatu': 'Matatu 100, 120, 121 or 116 toward Kiambu Rd; alight near Sharks Gate / DCI', 'desc': 'Popular for cycling and dog walks. Bike hire often available at this gate.', 'price_level': 'Budget', 'damage': 600, 'gate': 'Citizen ~KES 100–174 + bike hire if needed', 'indoor': False, 'wifi': False, 'sockets': False, 'pets': True, 'parking': True, 'dress': 'Sporty / Casual', 'hours': '06:00 AM - 06:00 PM', 'image': 'https://images.unsplash.com/photo-1511497584788-876760111969?w=1200&q=80'}, {'name': 'Ngong Hills Forest Reserve Trailhead', 'town': 'Ngong', 'county': 'Kajiado', 'lat': -1.401, 'lng': 36.636, 'address': 'Ngong Hills Forest Reserve gate, near Ngong town', 'matatu': 'Matatu 111 from Railways (Memorial) to Ngong town; boda last 2 km to forest gate', 'desc': 'Ridge hike with Rift Valley views. KFS entry (M-Pesa/card). Start early.', 'price_level': 'Budget', 'damage': 800, 'gate': 'Citizen adult ~KES 232', 'indoor': False, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Hiking boots recommended', 'hours': '06:00 AM - 06:00 PM', 'image': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80'}, {'name': "Hell's Gate National Park — Elsa Gate", 'town': "Hell's Gate", 'county': 'Nakuru', 'lat': -0.915, 'lng': 36.31, 'address': 'Elsa Gate, Moi South Lake Road, Naivasha', 'matatu': 'Nairobi–Naivasha shuttle (e.g. OTC); in Naivasha take Karagita–Kongoni matatu, alight Elsa Gate', 'desc': 'Cycle or walk among zebra and giraffe; Ol Njorowa Gorge (guide required).', 'price_level': 'Moderate', 'damage': 2500, 'gate': 'EAC citizen adult ~KES 500; bike hire extra', 'indoor': False, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Sporty / Casual', 'hours': '06:00 AM - 06:00 PM', 'image': 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1200&q=80'}, {'name': 'Mount Longonot National Park', 'town': 'Longonot', 'county': 'Nakuru', 'lat': -0.914, 'lng': 36.456, 'address': 'Longonot National Park gate, near Longonot town', 'matatu': 'Nairobi–Naivasha highway; alight Longonot then boda/taxi to park gate', 'desc': 'Crater rim hike (2–3 hrs). Altitude ~2,150–2,780 m. Carry water.', 'price_level': 'Budget', 'damage': 1500, 'gate': 'KWS park fees apply', 'indoor': False, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Hiking boots; layers', 'hours': '06:00 AM - 06:00 PM', 'image': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80'}, {'name': 'Oloolua Nature Trail', 'town': 'Karen', 'county': 'Nairobi', 'lat': -1.3197, 'lng': 36.712, 'address': 'Oloolua Nature Trail, Karen, Nairobi', 'matatu': 'Karen matatu via Ngong Rd; Uber/Bolt to Oloolua or Hardy area', 'desc': 'Forest trail with caves and stream near Karen. Family-friendly.', 'price_level': 'Budget', 'damage': 700, 'gate': 'Small entry fee at gate', 'indoor': False, 'wifi': False, 'sockets': False, 'pets': True, 'parking': True, 'dress': 'Comfortable outdoor wear', 'hours': '08:00 AM - 05:00 PM', 'image': 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=1200&q=80'}, {'name': 'Nairobi National Park — Main Gate', 'town': 'Langata', 'county': 'Nairobi', 'lat': -1.3733, 'lng': 36.8589, 'address': 'Langata Road / Magadi Road approach, Nairobi National Park', 'matatu': 'Langata Rd matatus or Uber to main gate; guided game drive or self-drive', 'desc': 'Only national park inside a capital city. Rhinos, lions, giraffe against skyline.', 'price_level': 'Premium', 'damage': 5000, 'gate': 'KWS fees by residency; vehicle fees', 'indoor': False, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Casual', 'hours': '06:00 AM - 06:00 PM', 'image': 'https://images.unsplash.com/photo-1547970810-dc1eac37d174?w=1200&q=80'}, {'name': 'David Sheldrick Wildlife Trust Elephant Orphanage', 'town': 'Karen', 'county': 'Nairobi', 'lat': -1.375, 'lng': 36.776, 'address': 'Adjacent to Nairobi National Park, Karen', 'matatu': 'Uber/Bolt to Sheldrick; combine with Giraffe Centre same day', 'desc': 'Public viewing of orphaned elephants typically 11:00–12:00.', 'price_level': 'Moderate', 'damage': 2000, 'gate': 'Visit fee / foster program', 'indoor': False, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Casual', 'hours': '11:00 AM - 12:00 PM (public)', 'image': 'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=1200&q=80'}, {'name': 'Giraffe Centre (AFEW)', 'town': 'Langata', 'county': 'Nairobi', 'lat': -1.3755, 'lng': 36.745, 'address': 'Gogo Falls Road, Langata, Nairobi', 'matatu': 'Langata area; Uber recommended; combine with Sheldrick', 'desc': 'Feed Rothschild giraffes from the raised platform.', 'price_level': 'Moderate', 'damage': 2500, 'gate': 'Citizen and non-resident rates differ', 'indoor': False, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Casual', 'hours': '09:00 AM - 05:00 PM', 'image': 'https://images.unsplash.com/photo-1547721064-da2d2627f4b2?w=1200&q=80'}, {'name': 'Fourteen Falls', 'town': 'Thika', 'county': 'Kiambu', 'lat': -1.05, 'lng': 37.1, 'address': 'Fourteen Falls, off Thika Road corridor', 'matatu': 'Thika Rd matatu toward Thika; alight for Fourteen Falls junction then boda', 'desc': 'Scenic multi-step falls on the Athi River.', 'price_level': 'Budget', 'damage': 1000, 'gate': 'Local entry / guide fees', 'indoor': False, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Casual outdoor', 'hours': '08:00 AM - 05:00 PM', 'image': 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=1200&q=80'}, {'name': 'Lake Naivasha — Crescent Island Access', 'town': 'Naivasha', 'county': 'Nakuru', 'lat': -0.7667, 'lng': 36.35, 'address': 'Lake Naivasha shoreline / Crescent Island launches', 'matatu': 'Nairobi–Naivasha shuttle; boat operators at South Lake', 'desc': 'Boat to Crescent Island for walking among giraffe and antelope.', 'price_level': 'Moderate', 'damage': 4000, 'gate': 'Boat + island fees', 'indoor': False, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Casual', 'hours': '07:00 AM - 05:00 PM', 'image': 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&q=80'}, {'name': 'Aberdare National Park — Hiking Access', 'town': 'Nyeri', 'county': 'Nyeri', 'lat': -0.4167, 'lng': 36.7, 'address': 'Aberdare Range access via Nyeri / Naivasha sides', 'matatu': 'Nairobi–Nyeri bus; arrange park transfer or guided hike', 'desc': 'High-altitude forest, waterfalls and moorland.', 'price_level': 'Premium', 'damage': 6000, 'gate': 'KWS park fees + transport', 'indoor': False, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Hiking layers', 'hours': '06:00 AM - 06:00 PM', 'image': 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&q=80'}, {'name': 'Kakamega Forest National Reserve', 'town': 'Kakamega', 'county': 'Kakamega', 'lat': 0.2833, 'lng': 34.85, 'address': 'Kakamega Forest Reserve, Western Kenya', 'matatu': 'Kisumu–Kakamega bus; taxi/boda to forest gate', 'desc': "Kenya's main tropical rainforest remnant. Birding and guided trails.", 'price_level': 'Moderate', 'damage': 3000, 'gate': 'KFS/KWS fees', 'indoor': False, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Outdoor / insect protection', 'hours': '06:00 AM - 06:00 PM', 'image': 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&q=80'}, {'name': 'Shimba Hills National Reserve', 'town': 'Kwale', 'county': 'Kwale', 'lat': -4.25, 'lng': 39.4, 'address': 'Shimba Hills, near Ukunda / Kwale', 'matatu': 'SGR or bus to Ukunda/Mombasa then taxi to Shimba gate', 'desc': 'Coastal hills, Sheldrick Falls, sable antelope. Day trip from Diani.', 'price_level': 'Premium', 'damage': 5500, 'gate': 'KWS fees + transfer', 'indoor': False, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Casual outdoor', 'hours': '06:00 AM - 06:00 PM', 'image': 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80'}, {'name': 'Tigoni Tea Country Walks', 'town': 'Tigoni', 'county': 'Kiambu', 'lat': -1.128, 'lng': 36.698, 'address': 'Tigoni / Limuru tea estates, Kiambu County', 'matatu': 'Matatu toward Limuru/Tigoni via Banana Hill or Limuru Rd; boda within Tigoni', 'desc': 'Highland tea farms, cool climate walks and estate viewpoints.', 'price_level': 'Budget', 'damage': 1200, 'gate': 'Estate tour fees vary', 'indoor': False, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Comfortable outdoor', 'hours': '07:00 AM - 05:00 PM', 'image': 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=1200&q=80'}, {'name': 'Menengai Crater Viewpoint', 'town': 'Nakuru', 'county': 'Nakuru', 'lat': -0.25, 'lng': 36.07, 'address': 'Menengai Crater, Nakuru', 'matatu': 'Nakuru town then local taxi/boda to crater rim', 'desc': 'Massive caldera views above Nakuru.', 'price_level': 'Budget', 'damage': 1000, 'gate': 'Local access fees may apply', 'indoor': False, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Casual', 'hours': '07:00 AM - 05:00 PM', 'image': 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80'}, {'name': 'Diani Coastal Forest & Beach Path', 'town': 'Diani', 'county': 'Kwale', 'lat': -4.28, 'lng': 39.58, 'address': 'Diani Beach road, Kwale County', 'matatu': 'Bus/SGR to Ukunda; tuk-tuk along beach road', 'desc': 'Coastal forest remnants and beach walks.', 'price_level': 'Moderate', 'damage': 2000, 'gate': 'None for beach; activity fees extra', 'indoor': False, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Beach casual', 'hours': 'Sunrise - Sunset', 'image': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80'}, {'name': 'Watamu Marine National Park Edge', 'town': 'Watamu', 'county': 'Kilifi', 'lat': -3.353, 'lng': 40.018, 'address': 'Watamu, Kilifi County', 'matatu': 'Malindi/Watamu bus from Mombasa; boat operators in village', 'desc': 'Snorkelling and marine park access. Coral gardens nearby.', 'price_level': 'Premium', 'damage': 4500, 'gate': 'Marine park fees + boat', 'indoor': False, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Swimwear / cover-up', 'hours': '08:00 AM - 05:00 PM', 'image': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&q=80'}, {'name': 'Ol Pejeta Conservancy Edge (Nanyuki)', 'town': 'Nanyuki', 'county': 'Laikipia', 'lat': 0.02, 'lng': 36.9, 'address': 'Ol Pejeta / Nanyuki access, Laikipia', 'matatu': 'Nairobi–Nanyuki bus; conservancy transfer from Nanyuki', 'desc': 'Rhino sanctuary and chimps. Day visits from Nanyuki.', 'price_level': 'Luxury', 'damage': 12000, 'gate': 'Conservancy fees', 'indoor': False, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Safari casual', 'hours': '06:00 AM - 06:00 PM', 'image': 'https://images.unsplash.com/photo-1535941339077-2dd1c7963098?w=1200&q=80'}, {'name': 'Nairobi Arboretum', 'town': 'Kilimani', 'county': 'Nairobi', 'lat': -1.2745, 'lng': 36.801, 'address': 'State House Road / Arboretum, Nairobi', 'matatu': 'Short hop from CBD/Kilimani; matatu or walk from nearby stages', 'desc': 'City arboretum with tree trails and open lawns.', 'price_level': 'Budget', 'damage': 300, 'gate': 'Small entry fee', 'indoor': False, 'wifi': False, 'sockets': False, 'pets': True, 'parking': True, 'dress': 'Casual', 'hours': '08:00 AM - 06:00 PM', 'image': 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1200&q=80'}], 'eats': [{'name': 'Talisman Restaurant', 'town': 'Karen', 'county': 'Nairobi', 'lat': -1.3195, 'lng': 36.715, 'address': 'Ngong Road / Karen Road area, Karen', 'matatu': 'Karen matatu via Ngong Rd or Uber; ~30 min from Westlands', 'desc': 'Garden fine dining, seasonal fusion, long-standing Karen favourite. Closed Mondays.', 'price_level': 'Luxury', 'damage': 8000, 'gate': 'None', 'indoor': True, 'wifi': True, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Smart Casual', 'hours': '12:00 PM - 10:30 PM', 'image': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80'}, {'name': 'Cultiva Farm Kenya', 'town': 'Karen', 'county': 'Nairobi', 'lat': -1.325, 'lng': 36.72, 'address': 'Pofu Road off Bogani, Karen', 'matatu': 'Uber/Bolt to Cultiva Karen; parking on site', 'desc': 'Farm-to-table greenhouse dining; produce grown on site.', 'price_level': 'Premium', 'damage': 6000, 'gate': 'None', 'indoor': True, 'wifi': True, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Smart Casual', 'hours': '10:00 AM - 10:00 PM', 'image': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80'}, {'name': 'INTI — A Nikkei Experience', 'town': 'Westlands', 'county': 'Nairobi', 'lat': -1.268, 'lng': 36.812, 'address': '20th Floor, GTC / One Africa Place area, Westlands', 'matatu': 'Westlands matatus; alight near GTC / Waiyaki Way; Uber preferred evenings', 'desc': 'Japanese–Peruvian fine dining with skyline views. Reservations advised.', 'price_level': 'Luxury', 'damage': 15000, 'gate': 'None', 'indoor': True, 'wifi': True, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Smart Casual', 'hours': '12:00 PM - 11:00 PM', 'image': 'https://images.unsplash.com/photo-1579027989536-b7b1f875659b?w=1200&q=80'}, {'name': 'Artcaffe — The Oval Westlands', 'town': 'Westlands', 'county': 'Nairobi', 'lat': -1.2675, 'lng': 36.8105, 'address': 'The Oval, Ring Road, Westlands', 'matatu': 'Any Westlands matatu; short walk from Sarit / Ring Rd', 'desc': 'Reliable café for breakfast, salads, pastries and laptop-friendly seats.', 'price_level': 'Moderate', 'damage': 2500, 'gate': 'None', 'indoor': True, 'wifi': True, 'sockets': True, 'pets': False, 'parking': True, 'dress': 'Casual', 'hours': '07:00 AM - 10:00 PM', 'image': 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&q=80'}, {'name': 'Mama Oliech Restaurant', 'town': 'Kilimani', 'county': 'Nairobi', 'lat': -1.292, 'lng': 36.787, 'address': 'Kilimani, Nairobi', 'matatu': 'Ngong Rd / Argwings Kodhek matatus; short walk in Kilimani', 'desc': 'Famous for whole deep-fried fish with ugali and kachumbari.', 'price_level': 'Budget', 'damage': 1800, 'gate': 'None', 'indoor': True, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Casual', 'hours': '11:00 AM - 10:00 PM', 'image': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=80'}, {'name': 'About Thyme Restaurant', 'town': 'Westlands', 'county': 'Nairobi', 'lat': -1.26, 'lng': 36.805, 'address': 'Eldama Ravine Road, Westlands', 'matatu': 'Westlands; Uber to Eldama Ravine Rd recommended', 'desc': 'Leafy garden setting, global menu, strong for lunch and quiet dinners.', 'price_level': 'Premium', 'damage': 5500, 'gate': 'None', 'indoor': True, 'wifi': True, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Smart Casual', 'hours': '12:00 PM - 11:00 PM', 'image': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80'}, {'name': 'Seven Seafood & Grill', 'town': 'Westlands', 'county': 'Nairobi', 'lat': -1.267, 'lng': 36.808, 'address': 'ABC Place, Waiyaki Way, Westlands', 'matatu': 'Waiyaki Way matatus; alight ABC Place', 'desc': 'Seafood and grill by chef Kiran Jethwa. Upscale Westlands dining.', 'price_level': 'Luxury', 'damage': 10000, 'gate': 'None', 'indoor': True, 'wifi': True, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Smart Casual', 'hours': '12:00 PM - 11:00 PM', 'image': 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=1200&q=80'}, {'name': 'Nairobi Street Kitchen', 'town': 'Westlands', 'county': 'Nairobi', 'lat': -1.266, 'lng': 36.8115, 'address': 'Mpaka Road, Westlands', 'matatu': 'Westlands matatus to Mpaka Rd; walk to food-truck compound', 'desc': 'Colourful food-truck compound, street food and social vibe.', 'price_level': 'Moderate', 'damage': 2200, 'gate': 'None', 'indoor': False, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Casual', 'hours': '11:00 AM - 11:00 PM', 'image': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&q=80'}, {'name': "CJ's Westlands", 'town': 'Westlands', 'county': 'Nairobi', 'lat': -1.2685, 'lng': 36.809, 'address': 'Westlands / major mall corridor, Nairobi', 'matatu': 'Westlands mall access; parking available', 'desc': 'Family breakfasts, burgers and all-day dining.', 'price_level': 'Moderate', 'damage': 2800, 'gate': 'None', 'indoor': True, 'wifi': True, 'sockets': True, 'pets': False, 'parking': True, 'dress': 'Casual', 'hours': '07:00 AM - 10:00 PM', 'image': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80'}, {'name': 'Nyama Mama — Delta Westlands', 'town': 'Westlands', 'county': 'Nairobi', 'lat': -1.269, 'lng': 36.8075, 'address': 'Delta Corner / Oracle area, Westlands', 'matatu': 'Chiromo / Westlands matatus; short walk', 'desc': 'Modern Kenyan plates, nyama and playful interiors.', 'price_level': 'Moderate', 'damage': 3500, 'gate': 'None', 'indoor': True, 'wifi': True, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Casual', 'hours': '11:00 AM - 11:00 PM', 'image': 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=1200&q=80'}, {'name': 'Fogo Gaucho Westlands', 'town': 'Westlands', 'county': 'Nairobi', 'lat': -1.2665, 'lng': 36.81, 'address': 'Ring Road, Westlands', 'matatu': 'Westlands Ring Rd; parking nearby', 'desc': 'Brazilian churrasco all-you-can-eat experience.', 'price_level': 'Luxury', 'damage': 9000, 'gate': 'None', 'indoor': True, 'wifi': True, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Smart Casual', 'hours': '12:00 PM - 10:30 PM', 'image': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&q=80'}, {'name': 'Java House — Sarit Centre', 'town': 'Westlands', 'county': 'Nairobi', 'lat': -1.2615, 'lng': 36.804, 'address': 'Sarit Centre, Westlands', 'matatu': 'Any matatu to Sarit Centre, Westlands', 'desc': 'Kenyan café chain staple — coffee, breakfast and light meals.', 'price_level': 'Budget', 'damage': 1500, 'gate': 'None', 'indoor': True, 'wifi': True, 'sockets': True, 'pets': False, 'parking': True, 'dress': 'Casual', 'hours': '07:00 AM - 09:00 PM', 'image': 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&q=80'}, {'name': 'Boho Eatery Karen', 'town': 'Karen', 'county': 'Nairobi', 'lat': -1.33, 'lng': 36.718, 'address': 'Ndovu Road, Hardy / Karen', 'matatu': 'Uber to Hardy Karen; limited matatu last mile', 'desc': 'Mostly plant-based menu in a garden house setting.', 'price_level': 'Premium', 'damage': 4500, 'gate': 'None', 'indoor': True, 'wifi': True, 'sockets': False, 'pets': True, 'parking': True, 'dress': 'Casual', 'hours': '09:00 AM - 09:00 PM', 'image': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&q=80'}, {'name': 'Pili Restaurant — GTC Westlands', 'town': 'Westlands', 'county': 'Nairobi', 'lat': -1.2682, 'lng': 36.8118, 'address': 'GTC Mall, Waiyaki Way, Westlands', 'matatu': 'Waiyaki Way to GTC Mall', 'desc': 'Highly rated upscale dining at GTC Westlands.', 'price_level': 'Luxury', 'damage': 11000, 'gate': 'None', 'indoor': True, 'wifi': True, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Smart Casual', 'hours': '12:00 PM - 11:00 PM', 'image': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80'}, {'name': 'Beit é Selam Westlands', 'town': 'Westlands', 'county': 'Nairobi', 'lat': -1.265, 'lng': 36.8095, 'address': 'Westlands, Nairobi', 'matatu': 'Westlands; neighbourhood directions / Uber', 'desc': 'Pan-African menu in a warm vinyl-and-lamp setting.', 'price_level': 'Premium', 'damage': 5000, 'gate': 'None', 'indoor': True, 'wifi': True, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Casual', 'hours': '12:00 PM - 10:00 PM', 'image': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80'}, {'name': 'Ora Cafe — Waiyaki Way', 'town': 'Westlands', 'county': 'Nairobi', 'lat': -1.27, 'lng': 36.806, 'address': 'Waiyaki Way, Westlands', 'matatu': 'Waiyaki Way corridor matatus', 'desc': 'All-day café for brunch, coffee and casual meals.', 'price_level': 'Moderate', 'damage': 2400, 'gate': 'None', 'indoor': True, 'wifi': True, 'sockets': True, 'pets': False, 'parking': True, 'dress': 'Casual', 'hours': '07:00 AM - 10:00 PM', 'image': 'https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=1200&q=80'}, {'name': 'Silver Oak Cafe — Rhapta', 'town': 'Westlands', 'county': 'Nairobi', 'lat': -1.264, 'lng': 36.8, 'address': 'Rhapta Promenade area, Westlands', 'matatu': 'Westlands / Rhapta Rd access', 'desc': 'Breakfast and coffee spot with a calm indoor setting.', 'price_level': 'Moderate', 'damage': 2000, 'gate': 'None', 'indoor': True, 'wifi': True, 'sockets': True, 'pets': False, 'parking': True, 'dress': 'Casual', 'hours': '07:00 AM - 09:00 PM', 'image': 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=1200&q=80'}, {'name': 'Urban Eatery — PwC Tower', 'town': 'Westlands', 'county': 'Nairobi', 'lat': -1.2655, 'lng': 36.807, 'address': 'PwC Tower / Delta Corner, Chiromo Rd', 'matatu': 'Chiromo Rd / Westlands; walk from Delta area', 'desc': 'Local and global plates in a bright modern space.', 'price_level': 'Moderate', 'damage': 3200, 'gate': 'None', 'indoor': True, 'wifi': True, 'sockets': True, 'pets': False, 'parking': True, 'dress': 'Casual', 'hours': '08:00 AM - 10:00 PM', 'image': 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=1200&q=80'}, {'name': 'News Cafe — Sarit Centre', 'town': 'Westlands', 'county': 'Nairobi', 'lat': -1.2618, 'lng': 36.8045, 'address': 'Sarit Centre, Westlands', 'matatu': 'Sarit Centre stage', 'desc': 'Mediterranean-leaning café inside Sarit.', 'price_level': 'Moderate', 'damage': 2600, 'gate': 'None', 'indoor': True, 'wifi': True, 'sockets': True, 'pets': False, 'parking': True, 'dress': 'Casual', 'hours': '08:00 AM - 10:00 PM', 'image': 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=1200&q=80'}, {'name': 'Carnivore Restaurant', 'town': 'Langata', 'county': 'Nairobi', 'lat': -1.336, 'lng': 36.803, 'address': 'Langata Road, next to GP Karting area', 'matatu': 'Langata Rd matatus or Uber to Carnivore grounds', 'desc': 'Iconic nyama choma and game-meat experience for groups and visitors.', 'price_level': 'Premium', 'damage': 7000, 'gate': 'None', 'indoor': True, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Casual', 'hours': '12:00 PM - 11:00 PM', 'image': 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=1200&q=80'}], 'nightlife': [{'name': 'The Alchemist', 'town': 'Westlands', 'county': 'Nairobi', 'lat': -1.2645, 'lng': 36.813, 'address': 'Parklands Road, Westlands', 'matatu': 'Westlands matatus to Parklands Rd; Uber strongly recommended after 10pm', 'desc': 'Open-air creative compound: bars, food trucks, live music and DJ nights.', 'price_level': 'Premium', 'damage': 5000, 'gate': 'Often free–KES 1,000 on event nights', 'indoor': False, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Smart Casual', 'hours': '04:00 PM - 04:00 AM', 'image': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80'}, {'name': 'Brew Bistro Rooftop — Fortis Tower', 'town': 'Westlands', 'county': 'Nairobi', 'lat': -1.2678, 'lng': 36.8108, 'address': 'Fortis Tower, Woodvale Grove, Westlands', 'matatu': 'Woodvale Grove; Uber at night', 'desc': 'Craft brewery rooftop with city views, house beers and weekend energy.', 'price_level': 'Premium', 'damage': 4500, 'gate': 'None typical; events may charge', 'indoor': True, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Smart Casual', 'hours': '04:00 PM - 03:00 AM', 'image': 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200&q=80'}, {'name': 'Sarabi Rooftop Bar — Sankara Nairobi', 'town': 'Westlands', 'county': 'Nairobi', 'lat': -1.2688, 'lng': 36.8095, 'address': 'Sankara Nairobi, Woodvale Grove, Westlands', 'matatu': 'Woodvale Grove; hotel entrance', 'desc': 'Upscale hotel rooftop cocktails and skyline views.', 'price_level': 'Luxury', 'damage': 8000, 'gate': 'None', 'indoor': True, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Smart Casual / Elegant', 'hours': '05:00 PM - 01:00 AM', 'image': 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=1200&q=80'}, {'name': 'Kiza Lounge', 'town': 'Westlands', 'county': 'Nairobi', 'lat': -1.266, 'lng': 36.8125, 'address': 'Westlands nightlife circuit', 'matatu': 'Westlands; Uber after dark', 'desc': 'Pan-African themed lounge with live music and DJ sets.', 'price_level': 'Premium', 'damage': 5500, 'gate': 'KES 1,000–2,000 weekends', 'indoor': True, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Smart Casual', 'hours': '06:00 PM - 04:00 AM', 'image': 'https://images.unsplash.com/photo-1571266028247-c4d288f0e2c2?w=1200&q=80'}, {'name': 'B-Club Nairobi', 'town': 'Kilimani', 'county': 'Nairobi', 'lat': -1.29, 'lng': 36.785, 'address': 'Kilimani, Nairobi', 'matatu': 'Uber/Bolt only recommended late night', 'desc': 'High-end bottle-service club, strict dress code, premium sound.', 'price_level': 'Luxury', 'damage': 12000, 'gate': 'KES 1,500–3,000', 'indoor': True, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Smart / Formal clubwear', 'hours': '10:00 PM - 05:00 AM', 'image': 'https://images.unsplash.com/photo-1566417713940-ae1157091c9e?w=1200&q=80'}, {'name': 'Havana Club Westlands', 'town': 'Westlands', 'county': 'Nairobi', 'lat': -1.267, 'lng': 36.811, 'address': 'Woodvale / Westlands circuit', 'matatu': 'Woodvale Grove area; Uber nights', 'desc': 'Long-running Westlands club with Latin and R&B leanings.', 'price_level': 'Premium', 'damage': 4000, 'gate': 'Varies by night', 'indoor': True, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Smart Casual', 'hours': '09:00 PM - 04:00 AM', 'image': 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&q=80'}, {'name': 'Attic Rooftop — Park Inn Westlands', 'town': 'Westlands', 'county': 'Nairobi', 'lat': -1.2655, 'lng': 36.8085, 'address': 'Park Inn by Radisson, Westlands', 'matatu': 'Westlands hotel cluster; Uber', 'desc': '11th-floor rooftop cocktails with panoramic views.', 'price_level': 'Premium', 'damage': 6000, 'gate': 'None', 'indoor': True, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Smart Casual', 'hours': '05:00 PM - 12:00 AM', 'image': 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80'}, {'name': 'Sky Bar — ibis Styles Westlands', 'town': 'Westlands', 'county': 'Nairobi', 'lat': -1.264, 'lng': 36.801, 'address': 'ibis Styles, Rhapta Road, Westlands', 'matatu': 'Rhapta Rd / Westlands', 'desc': 'Rooftop terrace with wide city views.', 'price_level': 'Moderate', 'damage': 3500, 'gate': 'None', 'indoor': True, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Casual / Smart Casual', 'hours': '05:00 PM - 12:00 AM', 'image': 'https://images.unsplash.com/photo-1566417713940-ae1157091c9e?auto=format&fit=crop&w=1200&q=80'}, {'name': 'MUZE Club', 'town': 'Westlands', 'county': 'Nairobi', 'lat': -1.2668, 'lng': 36.8122, 'address': 'Electric Avenue / Westlands club buildings', 'matatu': 'Westlands Electric Avenue; Uber only late', 'desc': 'Funktion-One powered electronic music club.', 'price_level': 'Premium', 'damage': 5000, 'gate': 'Event tickets', 'indoor': True, 'wifi': False, 'sockets': False, 'pets': False, 'parking': False, 'dress': 'Clubwear', 'hours': '10:00 PM - 05:00 AM', 'image': 'https://images.unsplash.com/photo-1571266028247-c4d288f0e2c2?auto=format&fit=crop&w=1200&q=80'}, {'name': 'Shelter Club', 'town': 'Westlands', 'county': 'Nairobi', 'lat': -1.2662, 'lng': 36.8118, 'address': 'Electric Avenue, Westlands', 'matatu': 'Electric Avenue; Uber nights', 'desc': 'Independent electronic / alternative dance floors above the avenue.', 'price_level': 'Moderate', 'damage': 3000, 'gate': 'Event fees', 'indoor': True, 'wifi': False, 'sockets': False, 'pets': False, 'parking': False, 'dress': 'Casual club', 'hours': '10:00 PM - 04:00 AM', 'image': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80'}, {'name': 'K1 Klub House', 'town': 'Parklands', 'county': 'Nairobi', 'lat': -1.255, 'lng': 36.82, 'address': 'Parklands, Nairobi', 'matatu': 'Parklands matatus by day; Uber at night', 'desc': 'Live music and club nights; major Parklands nightlife anchor.', 'price_level': 'Premium', 'damage': 4500, 'gate': 'Varies', 'indoor': True, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Smart Casual', 'hours': '06:00 PM - 04:00 AM', 'image': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&q=80'}, {'name': 'Hero Bar Gigiri', 'town': 'Gigiri', 'county': 'Nairobi', 'lat': -1.236, 'lng': 36.7989, 'address': 'Gigiri / Limuru Road area', 'matatu': 'Limuru Rd toward Gigiri / Village Market; Uber', 'desc': 'Destination cocktail bar with a strong drinks program.', 'price_level': 'Luxury', 'damage': 7000, 'gate': 'None', 'indoor': True, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Smart Casual', 'hours': '05:00 PM - 01:00 AM', 'image': 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=1200&q=80'}, {'name': 'Jekyll & Hyde Westlands', 'town': 'Westlands', 'county': 'Nairobi', 'lat': -1.2672, 'lng': 36.8102, 'address': 'Westlands', 'matatu': 'Westlands; Uber evenings', 'desc': 'Craft cocktail stop on the Westlands circuit.', 'price_level': 'Premium', 'damage': 4000, 'gate': 'None', 'indoor': True, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Smart Casual', 'hours': '05:00 PM - 01:00 AM', 'image': 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1200&q=80'}, {'name': '270° Rooftop Westlands', 'town': 'Westlands', 'county': 'Nairobi', 'lat': -1.2658, 'lng': 36.8078, 'address': 'Lantana Road area, Westlands', 'matatu': 'Westlands Lantana Rd; Uber', 'desc': 'Panoramic rooftop bar, strong for photos and cocktails.', 'price_level': 'Premium', 'damage': 5500, 'gate': 'None', 'indoor': True, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Smart Casual', 'hours': '05:00 PM - 12:00 AM', 'image': 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200&h=800&fit=crop'}, {'name': 'Brew Bistro — Ngong Road', 'town': 'Kilimani', 'county': 'Nairobi', 'lat': -1.3, 'lng': 36.78, 'address': 'Ngong Road, Nairobi', 'matatu': 'Ngong Rd matatus; Uber nights', 'desc': 'Sister Brew Bistro location — beer, food and evening social energy.', 'price_level': 'Moderate', 'damage': 3500, 'gate': 'None', 'indoor': True, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Casual', 'hours': '04:00 PM - 02:00 AM', 'image': 'https://images.unsplash.com/photo-1436076863939-06870fe779c2?w=1200&q=80'}, {'name': 'The Tap Westlands', 'town': 'Westlands', 'county': 'Nairobi', 'lat': -1.2665, 'lng': 36.8112, 'address': 'Westlands', 'matatu': 'Westlands circuit; Uber late', 'desc': 'Craft beers, cocktails and a busy dance floor.', 'price_level': 'Moderate', 'damage': 3200, 'gate': 'Varies', 'indoor': True, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Casual', 'hours': '05:00 PM - 03:00 AM', 'image': 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=1200&q=80'}], 'action': [{'name': 'Mad Max Karting — Two Rivers Mall', 'town': 'Ruaka', 'county': 'Nairobi', 'lat': -1.2035, 'lng': 36.7836, 'address': 'Two Rivers Mall, Limuru Road / Northern Bypass', 'matatu': 'Limuru Rd or Northern Bypass matatu to Ruaka / Two Rivers; mall parking', 'desc': 'Go-karting at Two Rivers. Book peak weekends.', 'price_level': 'Moderate', 'damage': 3500, 'gate': 'Session fees at counter', 'indoor': True, 'wifi': True, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Sporty / closed shoes', 'hours': '10:00 AM - 09:00 PM', 'image': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80'}, {'name': 'GP Karting Langata', 'town': 'Langata', 'county': 'Nairobi', 'lat': -1.3365, 'lng': 36.8025, 'address': 'Langata Road, near Carnivore', 'matatu': 'Langata Rd matatus; alight Carnivore / GP Karting area', 'desc': 'Classic Nairobi go-kart track. Combine with Carnivore lunch.', 'price_level': 'Moderate', 'damage': 3000, 'gate': 'Session from ~KES 1,300', 'indoor': False, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Sporty', 'hours': '09:00 AM - 06:00 PM', 'image': 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&q=80'}, {'name': 'Panari Sky Centre Ice Rink', 'town': 'Mombasa Road', 'county': 'Nairobi', 'lat': -1.319, 'lng': 36.85, 'address': 'Panari Hotel / Sky Centre, Mombasa Road', 'matatu': 'Mombasa Rd matatus; alight Panari', 'desc': 'East Africa ice skating rink. Gear hire on site.', 'price_level': 'Moderate', 'damage': 2500, 'gate': 'Session ~KES 800–1,000', 'indoor': True, 'wifi': True, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Warm layers', 'hours': '10:00 AM - 10:00 PM', 'image': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&q=80'}, {'name': 'Climb BlueSky — Diamond Plaza', 'town': 'Parklands', 'county': 'Nairobi', 'lat': -1.2555, 'lng': 36.821, 'address': 'Diamond Plaza, Parklands / Highridge', 'matatu': 'Parklands / Highridge matatus to Diamond Plaza', 'desc': 'Indoor climbing walls for beginners and advanced.', 'price_level': 'Moderate', 'damage': 2800, 'gate': '~KES 1,000 / session', 'indoor': True, 'wifi': True, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Sporty', 'hours': '11:00 AM - 08:00 PM', 'image': 'https://images.unsplash.com/photo-1522163181144-4871ff30bf21?w=1200&q=80'}, {'name': 'Paintball Fury — Waterfront Karen', 'town': 'Karen', 'county': 'Nairobi', 'lat': -1.34, 'lng': 36.715, 'address': 'Waterfront Mall / Karen adventure cluster', 'matatu': 'Karen via Ngong Rd; Uber to Waterfront', 'desc': 'Paintball games for groups and team building.', 'price_level': 'Moderate', 'damage': 4000, 'gate': 'Session package', 'indoor': False, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Clothes you can get paint on', 'hours': '09:00 AM - 06:00 PM', 'image': 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=1200&q=80'}, {'name': 'The Forest — Kereita Zipline', 'town': 'Kimende', 'county': 'Kiambu', 'lat': -0.98, 'lng': 36.65, 'address': 'Kereita Forest, Kimende / Rift edge', 'matatu': 'Nairobi–Naivasha road toward Kimende; organised transfer recommended', 'desc': 'Multi-line zipline over forest valleys, plus archery and paintball options.', 'price_level': 'Premium', 'damage': 7000, 'gate': 'Activity packages', 'indoor': False, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Sporty; closed shoes', 'hours': '08:00 AM - 05:00 PM', 'image': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop&q=80'}, {'name': 'Savage Wilderness — Sagana', 'town': 'Sagana', 'county': 'Kirinyaga', 'lat': -0.67, 'lng': 37.2, 'address': 'Savage Wilderness Camp, Sagana River', 'matatu': 'Nairobi–Nyeri/Embu corridor; transfer to camp', 'desc': 'Bungee, rafting and zipline over the Sagana River.', 'price_level': 'Premium', 'damage': 9000, 'gate': 'Activity fees', 'indoor': False, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Swimwear + dry clothes', 'hours': '08:00 AM - 05:00 PM', 'image': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80'}, {'name': 'Rapids Camp Sagana — Rafting', 'town': 'Sagana', 'county': 'Kirinyaga', 'lat': -0.668, 'lng': 37.195, 'address': 'Rapids Camp, Sagana', 'matatu': 'Nairobi highway toward Sagana; camp transfer', 'desc': 'White-water rafting and kayaking on the Sagana.', 'price_level': 'Premium', 'damage': 8000, 'gate': 'Raft package', 'indoor': False, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Swimwear', 'hours': '08:00 AM - 04:00 PM', 'image': 'https://images.unsplash.com/photo-1530866495561-507c9b27cdad?w=1200&q=80'}, {'name': 'Paradise Lost — Kiambu Road', 'town': 'Kiambu', 'county': 'Kiambu', 'lat': -1.15, 'lng': 36.85, 'address': 'Paradise Lost, Kiambu Road', 'matatu': 'Kiambu Rd matatus; alight Paradise Lost', 'desc': 'Caves, boat rides, horse riding and family recreation grounds.', 'price_level': 'Moderate', 'damage': 3000, 'gate': 'Entry + activity', 'indoor': False, 'wifi': False, 'sockets': False, 'pets': True, 'parking': True, 'dress': 'Casual outdoor', 'hours': '08:00 AM - 06:00 PM', 'image': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=70'}, {'name': 'Twin Rivers Resort — Tigoni', 'town': 'Tigoni', 'county': 'Kiambu', 'lat': -1.125, 'lng': 36.695, 'address': 'Twin Rivers, Tigoni', 'matatu': 'Limuru/Tigoni via Banana or Limuru Rd; last mile taxi/boda', 'desc': 'Quad biking, sky bike and riverside activities in the highlands.', 'price_level': 'Premium', 'damage': 6500, 'gate': 'Activity packages', 'indoor': False, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Sporty', 'hours': '09:00 AM - 06:00 PM', 'image': 'https://images.unsplash.com/photo-1534445867742-43195f401b6c?w=1200&q=80'}, {'name': 'Redhill Karting — Limuru', 'town': 'Limuru', 'county': 'Kiambu', 'lat': -1.11, 'lng': 36.65, 'address': 'Redhill / Limuru karting circuit', 'matatu': 'Limuru Rd toward Limuru; local directions to track', 'desc': 'Scenic highland go-kart circuit.', 'price_level': 'Moderate', 'damage': 3500, 'gate': 'Session fees', 'indoor': False, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Sporty', 'hours': '09:00 AM - 06:00 PM', 'image': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80'}, {'name': 'Whistling Morans — Lukenya', 'town': 'Athi River', 'county': 'Machakos', 'lat': -1.45, 'lng': 36.98, 'address': 'Lukenya / Athi River adventure area', 'matatu': 'Mombasa Rd toward Athi River; transfer to track', 'desc': 'Quad biking and outdoor thrills near Athi River.', 'price_level': 'Premium', 'damage': 5500, 'gate': 'Session', 'indoor': False, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Sporty; dust-ready', 'hours': '09:00 AM - 05:00 PM', 'image': 'https://images.unsplash.com/photo-1558618047-f4c54de006c5?w=1200&q=80'}, {'name': 'Diani Kite & Water Sports Schools', 'town': 'Diani', 'county': 'Kwale', 'lat': -4.282, 'lng': 39.585, 'address': 'Diani Beach water-sports operators', 'matatu': 'Ukunda then beach-road tuk-tuk', 'desc': 'Kitesurf, paddle and snorkel lessons on Diani shore.', 'price_level': 'Premium', 'damage': 8000, 'gate': 'Lesson packages', 'indoor': False, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Swimwear', 'hours': '08:00 AM - 05:00 PM', 'image': 'https://images.unsplash.com/photo-1502680390469-be75caf25bf9?w=1200&q=80'}, {'name': 'Naivasha Boat & Water Sports Docks', 'town': 'Naivasha', 'county': 'Nakuru', 'lat': -0.77, 'lng': 36.355, 'address': 'Lake Naivasha South Lake boat clubs', 'matatu': 'Naivasha shuttle then South Lake Road', 'desc': 'Boat hire, fishing and lake sports.', 'price_level': 'Moderate', 'damage': 4500, 'gate': 'Boat hire', 'indoor': False, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Casual / life jacket', 'hours': '07:00 AM - 05:00 PM', 'image': 'https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=1200&q=80'}, {'name': 'Escape Room Labs — Kilimani', 'town': 'Kilimani', 'county': 'Nairobi', 'lat': -1.288, 'lng': 36.786, 'address': 'Kilimani / Westlands escape room venues', 'matatu': 'Uber to booked venue', 'desc': 'Timed puzzle rooms for groups and dates.', 'price_level': 'Moderate', 'damage': 4000, 'gate': 'Per team session', 'indoor': True, 'wifi': True, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Casual', 'hours': '12:00 PM - 09:00 PM', 'image': 'https://images.unsplash.com/photo-1511882150382-421056c89033?w=1200&q=80'}, {'name': 'Ngong Hills Zipline Experiences', 'town': 'Ngong', 'county': 'Kajiado', 'lat': -1.395, 'lng': 36.64, 'address': 'Ngong Hills adventure operators', 'matatu': 'Matatu 111 to Ngong then operator transfer', 'desc': 'Zipline runs with ridge views of the Rift.', 'price_level': 'Premium', 'damage': 6000, 'gate': 'Package', 'indoor': False, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Sporty; closed shoes', 'hours': '08:00 AM - 05:00 PM', 'image': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=70'}, {'name': 'Jet Ski — Ruiru Dam Operators', 'town': 'Ruiru', 'county': 'Kiambu', 'lat': -1.14, 'lng': 36.97, 'address': 'Ruiru dam water-sports operators', 'matatu': 'Thika Superhighway to Ruiru; local transfer to dam', 'desc': 'Jet ski sessions on Ruiru dam.', 'price_level': 'Premium', 'damage': 5000, 'gate': 'Timed session', 'indoor': False, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Swimwear', 'hours': '09:00 AM - 05:00 PM', 'image': 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=1200&q=80'}, {'name': 'Bowling — Sarit Centre', 'town': 'Westlands', 'county': 'Nairobi', 'lat': -1.262, 'lng': 36.8042, 'address': 'Sarit Centre bowling, Westlands', 'matatu': 'Sarit Centre stage', 'desc': 'Indoor bowling for families and groups.', 'price_level': 'Budget', 'damage': 2000, 'gate': 'Per game', 'indoor': True, 'wifi': True, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Casual', 'hours': '10:00 AM - 10:00 PM', 'image': 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=1200&q=80'}, {'name': 'Trampoline Park — Nairobi Malls', 'town': 'Nairobi', 'county': 'Nairobi', 'lat': -1.28, 'lng': 36.82, 'address': 'Indoor trampoline venues in major malls', 'matatu': 'Mall access by matatu/Uber', 'desc': 'Family trampoline and soft-play energy burn.', 'price_level': 'Budget', 'damage': 1800, 'gate': 'Timed session', 'indoor': True, 'wifi': True, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Socks required', 'hours': '10:00 AM - 08:00 PM', 'image': 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&q=80'}, {'name': 'Nairobi Archery Sessions', 'town': 'Nairobi', 'county': 'Nairobi', 'lat': -1.3, 'lng': 36.8, 'address': 'Nairobi archery venues (booked club sessions)', 'matatu': 'Depends on host range — confirm booking (often Karen/Kiambu)', 'desc': 'Archery for beginners and groups. Book ahead.', 'price_level': 'Moderate', 'damage': 2500, 'gate': 'Session', 'indoor': False, 'wifi': False, 'sockets': False, 'pets': False, 'parking': True, 'dress': 'Casual', 'hours': '09:00 AM - 05:00 PM', 'image': 'https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?w=1200&q=80'}]}

PLACE_COLUMNS = {
    "matatu_route": "TEXT", "price_level": "TEXT", "damage_for_two": "REAL",
    "gate_fee": "TEXT", "mpesa_available": "BOOLEAN", "till_number": "TEXT",
    "parking": "BOOLEAN", "wifi": "BOOLEAN", "power_sockets": "BOOLEAN",
    "pet_friendly": "BOOLEAN", "is_indoor": "BOOLEAN", "dress_code": "TEXT",
    "reservation_required": "BOOLEAN", "opening_hours": "TEXT",
    "featured_image": "TEXT", "verified": "BOOLEAN", "created_at": "DATETIME",
    "category_id": "INTEGER", "name": "TEXT", "description": "TEXT",
    "latitude": "REAL", "longitude": "REAL", "county": "TEXT", "town": "TEXT",
    "address": "TEXT",
}

EVENT_TEMPLATES = {
    "nature": ["Sunrise Trail Walk", "Community Forest Run", "Birding Morning", "Picnic & Photo Walk", "Guided Nature Day"],
    "eats": ["Brunch Social", "Coffee Cupping Session", "Remote Workers Meetup", "Chef Table Night", "Weekend Food Market"],
    "nightlife": ["Afrobeats Live Night", "Rooftop Sunset Session", "Jazz & Cocktails", "DJ Warm-up Friday", "Ladies Night Social"],
    "action": ["Kart Open Session", "Group Climb Night", "Zipline Challenge Day", "Family Activity Package", "Team Paintball Cup"],
}


def _sqlite_path_from_uri(uri: str):
    if not uri:
        return None
    raw = uri.replace("sqlite:///", "").replace("sqlite://", "")
    if raw in (":memory:", ""):
        return None
    path = Path(raw)
    if not path.is_absolute():
        path = Path.cwd() / path
    return path


def ensure_schema():
    engine = db.engine
    dialect = engine.dialect.name
    if DROP_AND_RECREATE:
        db.drop_all()
        db.create_all()
        return
    print("Using existing schema (Flask-Migrate)…")
    db.create_all()
    if dialect != "sqlite":
        return
    db_path = _sqlite_path_from_uri(str(engine.url))
    if db_path is None or not db_path.exists():
        return
    conn = sqlite3.connect(str(db_path))
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='places'")
    if not cur.fetchone():
        conn.close()
        db.create_all()
        return
    cur.execute("PRAGMA table_info(places)")
    existing = {row[1] for row in cur.fetchall()}
    added = []
    for col, typ in PLACE_COLUMNS.items():
        if col not in existing:
            try:
                cur.execute(f"ALTER TABLE places ADD COLUMN {col} {typ}")
                added.append(col)
            except sqlite3.OperationalError as e:
                print(f"  warn {col}: {e}")
    conn.commit()
    conn.close()
    db.create_all()
    print(f"  columns added: {added or 'none'}")


def _clear_all():
    for table_name in ("place_tags", "place_tag", "places_tags", "event_tags", "event_bookmarks"):
        try:
            db.session.execute(db.text(f"DELETE FROM {table_name}"))
        except Exception:
            pass
    for model in (VibeCheck, Event, PlaceImage, Place, Tag, Category, User):
        try:
            model.query.delete()
        except Exception:
            pass
    db.session.commit()


def _dict_to_place(category, p: dict) -> Place:
    return Place(
        category_id=category.category_id,
        name=p["name"],
        description=p["desc"],
        latitude=p["lat"],
        longitude=p["lng"],
        county=p["county"],
        town=p["town"],
        address=p["address"],
        matatu_route=p["matatu"],
        price_level=p["price_level"],
        damage_for_two=p["damage"],
        gate_fee=p["gate"],
        mpesa_available=True,
        till_number=str(random.randint(100000, 999999)),
        parking=p["parking"],
        wifi=p["wifi"],
        power_sockets=p["sockets"],
        pet_friendly=p["pets"],
        is_indoor=p["indoor"],
        dress_code=p["dress"],
        reservation_required=p["price_level"] in ("Luxury", "Premium") and "Nightlife" in (category.name or ""),
        opening_hours=p["hours"],
        featured_image=p["image"],
        verified=True,
    )


def seed_data():
    if RANDOM_SEED is not None:
        random.seed(RANDOM_SEED)

    print("=" * 60)
    print("GemSpot KE — UNIQUE real places seeder")
    print("=" * 60)

    ensure_schema()
    if not DROP_AND_RECREATE:
        print("Clearing existing rows…")
        _clear_all()

    print("Users…")
    admin = User(
        first_name="Admin", last_name="GemSpot", username="admin",
        email="admin@gemspot.co.ke", phone="+254700000000",
        bio="Official GemSpot KE Administrator", is_admin=True,
    )
    admin.set_password("AdminPass2026!")
    test_user = User(
        first_name="Wanjiku", last_name="Kamau", username="wanjiku_k",
        email="wanjiku@example.com", phone="+254711223344",
        bio="Coffee addict, Tigoni weekender & hiker.",
    )
    test_user.set_password("Password123!")
    extras = []
    for fn, ln in [("Brian", "Otieno"), ("Aisha", "Hassan"), ("Kevin", "Mwangi"),
                   ("Faith", "Njeri"), ("Sam", "Kiptoo")]:
        u = User(
            first_name=fn, last_name=ln,
            username=f"{fn.lower()}_{ln.lower()[:1]}",
            email=f"{fn.lower()}.{ln.lower()}@example.com",
            phone=f"+25471{random.randint(1000000, 9999999)}",
            bio=f"{fn} explores Kenya with GemSpot.",
        )
        u.set_password("Password123!")
        extras.append(u)
    db.session.add_all([admin, test_user, *extras])
    db.session.commit()

    print("Categories…")
    cat_nature = Category(name="Nature & Outdoors", icon="tree",
                          description="Parks, forests, hikes across Kenya", theme_color="Emerald")
    cat_cafe = Category(name="Cafes & Workspaces", icon="coffee",
                        description="Restaurants, cafés and work-friendly spots", theme_color="Amber")
    cat_nightlife = Category(name="Nightlife & Vibes", icon="music",
                             description="Clubs, lounges, rooftops", theme_color="Sapphire")
    cat_adventure = Category(name="Action & Adventure", icon="compass",
                             description="Karting, climbing, water sports", theme_color="Ruby")
    db.session.add_all([cat_nature, cat_cafe, cat_nightlife, cat_adventure])
    db.session.commit()

    print("Tags…")
    tag_names = [
        "Fast WiFi", "Scenic Views", "Great Cocktails", "Family Friendly", "Pet Friendly",
        "Secure Parking", "M-Pesa Friendly", "Date Night", "Live Music", "Outdoor Seating",
        "Power Sockets", "Budget Friendly", "Premium Experience", "Group Friendly",
        "Quiet Workspace", "Tea Farm", "Coastal", "Highland", "Water Sports", "Hiking",
    ]
    tags = [Tag(name=n) for n in tag_names]
    db.session.add_all(tags)
    db.session.commit()
    T = {t.name: t for t in tags}
    tags_for = {
        "nature": [T["Scenic Views"], T["Family Friendly"], T["Hiking"], T["Highland"], T["Budget Friendly"]],
        "eats": [T["Fast WiFi"], T["Power Sockets"], T["Quiet Workspace"], T["M-Pesa Friendly"], T["Outdoor Seating"]],
        "nightlife": [T["Great Cocktails"], T["Live Music"], T["Date Night"], T["Secure Parking"], T["Premium Experience"]],
        "action": [T["Family Friendly"], T["Group Friendly"], T["Water Sports"], T["Secure Parking"], T["M-Pesa Friendly"]],
    }

    cat_map = {
        "nature": cat_nature,
        "eats": cat_cafe,
        "nightlife": cat_nightlife,
        "action": cat_adventure,
    }

    all_places = []
    places_by_key = {}
    seen = set()

    print("Places (unique real venues)…")
    for key, category in cat_map.items():
        batch = []
        for p in PLACES_DATA[key]:
            if p["name"] in seen:
                raise RuntimeError(f"Duplicate: {p['name']}")
            seen.add(p["name"])
            batch.append(_dict_to_place(category, p))
        db.session.add_all(batch)
        db.session.commit()
        pool = tags_for[key]
        for place in batch:
            place.tags = random.sample(pool, k=min(3, len(pool)))
        db.session.commit()
        print(f"  ✓ {category.name}: {len(batch)}")
        places_by_key[key] = batch
        all_places.extend(batch)

    print("Gallery…")
    imgs = []
    for place in all_places:
        for _ in (1, 2):
            imgs.append(PlaceImage(
                place_id=place.place_id,
                image_url=place.featured_image,
                caption=f"{place.town} — {place.name[:40]}",
            ))
    db.session.add_all(imgs)
    db.session.commit()

    print("Events…")
    for key, category in cat_map.items():
        hosts = places_by_key[key]
        titles = EVENT_TEMPLATES[key]
        events = []
        for i, host in enumerate(hosts):
            start = datetime.now(timezone.utc) + timedelta(days=random.randint(3, 90), hours=random.randint(8, 20))
            end = start + timedelta(hours=random.randint(2, 5))
            events.append(Event(
                place_id=host.place_id,
                venue_name=host.name,
                category_id=category.category_id,
                title=f"{titles[i % len(titles)]} @ {host.town}",
                description=f"Event at {host.name}, {host.county}.",
                start_date=start,
                end_date=end,
                ticket_price=random.choice([0, 500, 1000, 1500, 2000, 3000]),
                banner=host.featured_image,
                google_calendar_link="https://calendar.google.com",
                status="Upcoming",
            ))
        db.session.add_all(events)
        db.session.commit()
        print(f"  ✓ events {category.name}: {len(events)}")

    print("Vibes…")
    reviewers = [test_user, *extras]
    notes = ["Calm midweek.", "Busy Saturdays — arrive early.", "Great for dates.", "M-Pesa worked.", "Worth the matatu hop."]
    vibes = []
    for place in random.sample(all_places, k=min(40, len(all_places))):
        author = random.choice(reviewers)
        kwargs = {"place_id": place.place_id, "user_id": author.user_id}
        for field, value in [
            ("crowd_level", random.choice(["Quiet", "Moderate", "Packed"])),
            ("caption", random.choice(notes)),
            ("comment", random.choice(notes)),
        ]:
            if hasattr(VibeCheck, field):
                kwargs[field] = value
        try:
            vibes.append(VibeCheck(**kwargs))
        except TypeError:
            continue
    try:
        db.session.add_all(vibes)
        db.session.commit()
        print(f"  ✓ {len(vibes)} vibes")
    except Exception as e:
        db.session.rollback()
        print(f"  vibe skip: {e}")

    sample = Place.query.first()
    if sample is None:
        raise RuntimeError("No places inserted")
    _ = sample.matatu_route
    print()
    print("✅ Seed complete")
    print(f"   Places: {Place.query.count()} unique")
    print(f"   Events: {Event.query.count()}")
    print("   Admin: admin@gemspot.co.ke / AdminPass2026!")
    print("   User:  wanjiku@example.com / Password123!")


if __name__ == "__main__":
    try:
        from main import app
    except ImportError:
        from app import create_app
        app = create_app()
    with app.app_context():
        seed_data()
