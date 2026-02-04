/**
 * Maskerar känsliga personuppgifter i text med regex-baserad metod
 * Utökad för sjukvårdsanvändning med medicinsk terminologi
 */
export async function maskSensitiveData(input: string): Promise<string> {
  if (!input || !input.trim()) {
    return input ?? "";
  }

  let masked = input;

  // Bankkort (16 siffror) - gör detta först för att undvika konflikter
  masked = masked.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, "[MASKERAT KORTNUMMER]");

  // Personnummer (YYMMDD-XXXX eller YYYYMMDD-XXXX)
  masked = masked.replace(/\b(?:\d{6}|\d{8})[-+]\d{4}\b/g, "[MASKERAT PERSONNUMMER]");

  // Organisationsnummer (börjar oftast med 55, 16, 20, etc)
  masked = masked.replace(/\b(?:55|16|20|21|22|23|24|25|26|27|28|29|30|31|32|33|34|35|36|37|38|39|40|41|42|43|44|45|46|47|48|49|50|51|52|53|54|56|57|58|59|60|61|62|63|64|65|66|67|68|69|70|71|72|73|74|75|76|77|78|79|80|81|82|83|84|85|86|87|88|89|90|91|92|93|94|95|96|97|98|99)\d{4}-\d{4}\b/g, "[MASKERAT ORGNR]");

  // E-postadresser
  masked = masked.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}/g, "[MASKERAD E-POST]");

  // Internationella telefonnummer
  masked = masked.replace(/\b\+\d{1,3}[\s-]?\d{1,4}[\s-]?\d{1,4}[\s-]?\d{1,9}\b/g, "[MASKERAT TELEFONNUMMER]");

  // Svenska telefonnummer
  masked = masked.replace(/\b(?:\+46|0)([\s-]?\d){2,3}[\s-]?\d{2,3}[\s-]?\d{2}[\s-]?\d{2}\b/g, "[MASKERAT TELEFONNUMMER]");

  // === SJUKVÅRDSSPECIFIK MASKERING ===
  
  // Svenska namn (förnamn + efternamn) - vanliga svenska namn
  const commonSwedishNames = /\b(Anna|Eva|Maria|Sofia|Astrid|Ingrid|Margarita|Karin|Cecilia|Emma|Julia|Linnea|Maja|Alice|Ebba|Amanda|Molly|Wilma|Elsa|Agnes|Alicia|Ellen|Clara|Lilly|Nova|Stella|Selma|Leia|Freja|Alma|Tilde|Olivia|Johanna|Ida|Viktoria|Amanda|Emilia|Isabella|Rebecca|Sara|Linda|Camilla|Helena|Susanne|Marianne|Ulla|Birgitta|Ingegerd|Gunilla|Margareta|Kerstin|Annika|Carina|Mona|Lena|Kicki|Anette|Susann|Pernilla|Jessica|Malin|Sandra|Hanna|Lina|Sofie|Josefine|Angelica|Linda|Elin|Frida|Sofia|Mats|Lars|Anders|Johan|Erik|Peter|Thomas|Fredrik|Daniel|Mikael|Stefan|Per|Nils|Jan|Bengt|Göran|Kjell|Lennart|Roger|Bo|Sven|Ulf|Björn|Hans|Gunnar|Ove|Leif|Rolf|Åke|Börje|Ingemar|Lars-Erik|Karl-Erik|Göran|Sture|Arne|Rune|Folke|Valter|Einar|Torsten|Sven-Erik|Nils-Erik|Bernt|Gustav|Harald|Folke|Ebbe|Ebbe|Ragnar|Sigvard|Ivar|Helge|Alf|Ebbe|Ragnar|Sigvard|Ivar|Helge|Alf|Ebbe|Ragnar|Sigvard|Ivar|Helge|Alf)\s+([A-ZÅÄÖ][a-zåäö]+(?:son|sson|sen|dottir|datter)?|[A-ZÅÄÖ][a-zåäö]{2,})\b/g;
  masked = masked.replace(commonSwedishNames, "[MASKERAT NAMN]");

  // Generiska namnmönster (förnamn + efternamn)
  masked = masked.replace(/\b([A-ZÅÄÖ][a-zåäö]{2,})\s+([A-ZÅÄÖ][a-zåäö]{2,})\b/g, "[MASKERAT NAMN]");

  // Medicinska diagnoser och tillstånd
  const medicalTerms = /\b(diabetes|hypertoni|cancer|stroke|hjärtinfarkt|angina|arytmi|kardiovaskulär|pulmonell|astma|KOL|pneumoni|bronkit|influensa|feber|hosta|andfåddhet|bröstsmärta|magsmäta|ulcerös|colitis|crohn|ibs|hepatit|cirros|njursvikt|dialys|osteoporos|artrit|reumatism|ms|parkinson|alzheimer|demens|epilepsi|migrän|depression|ångest|psykos|schizofreni|bipolär|adhd|autism|asperger|downs|turner|klinefelter|hemofili|leukemi|lymfom|melanom|basalcell|skivepitel|bröstcancer|prostatacancer|tarmcancer|lungcancer|levercancer|njurcancer|hudcancer|tumör|metastas|kemoterapi|strålbehandling|immunterapi|kirurgi|operation|biopsi|endoskopi|koloskopi|magnetresonans| röntgen|ultraljud|ekokardiografi|ekg|blodprov|urinprov|vätskeprov|biokemi|hematologi|patologi|cytologi|histologi|genetik|kromosom|dna|rna|protein|enzym|hormon|insulin|thyroxin|kortison|antibiotika|antiviralt|antifungalt|smärtstillande|antiinflammatoriskt|antikoagulant|blodtryckssänkande|diuretika|betablockerare|ac-hämmare|statiner|antidepressiva|antipsykotika|anxiolytika|sömnpiller|epilepsimedicin|parkinsonmedicin|alzheimermedicin|demensmedicin|osteoporosmedicin|artritmedicin|reumatismmedicin|msmedicin|parkinsonmedicin)\b/gi;
  masked = masked.replace(medicalTerms, "[MASKERAD DIAGNOS]");

  // Läkemedel och substanser
  const medications = /\b(paracetamol|ibuprofen|naproxen|diklofenak|acetylsalicylsyra|metformin|insulin|glukagon|waran|heparin|alvedon|ipren|voltaren|naprosyn|treo|aspirin|metformin|glucophage|insulin|novorapid|humalog|lantus|levemir|tresiba|waran|marevan|xarelto|eliquis|plavix|brilique|seloken|metoprolol|atenolol|bisoprolol|carvedilol|ramipril|enalapril|lisinopril|losartan|valsartan|candesartan|amlodipin|felodipin|hydrochlorothiazid|furosemid|bumetanid|spironolakton|simvastatin|atorvastatin|rosuvastatin|pravastatin|ezetimib|omeprazol|esomeprazol|pantoprazol|lansoprazol|ranitidin|famotidin|cimetidin|salbutamol|budesonid|flutikason|salmeterol|formoterol|tiotropium|ipratropium|montelukast|zafirlukast|desloratadin|loratadin|cetirizin|fexofenadin|diphenhydramin|hydroxyzin|prometazin|ondansetron|granisetron|metoklopramid|domperidon|loperamid|kolestyramin|mesalazin|sulfasalazin|azathioprin|mercaptopurin|methotrexat|infliximab|adalimumab|etanercept|abatacept|rituximab|tocilizumab|baricitinib|tofacitinib|upadacitinib|hydroxychloroquine|chloroquine|azithromycin|doxycyclin|amoxicillin|penicillin|cefalexin|cefuroxim|nitrofurantoin|trimetoprim|sulfametoxazol|fluconazol|itraconazol|vorikonazol|amphotericin|acyclovir|valacyclovir|famciclovir|oseltamivir|zanamivir|baloxavir|remdesivir|dexamethason|prednisolon|prednison|hydrokortison|betametason|triamcinolon|levotyroxin|liothyronin|methimazol|propylthiouracil|carbimazol|oxkarbazepin|lamotrigin|topiramat|valproat|gabapentin|pregabalin|duloxetin|venlafaxin|sertralin|citalopram|escitalopram|fluoxetin|paroxetin|mirtazapin|trazodon|bupropion|vortioxetin|agomelatin|lithium|valproat|lamotrigin|karbamazepin|oxkarbazepin|topiramat|gabapentin|pregabalin|duloxetin|venlafaxin|sertralin|citalopram|escitalopram|fluoxetin|paroxetin|mirtazapin|trazodon|bupropion|vortioxetin|agomelatin|lithium|valproat|lamotrigin|karbamazepin|oxkarbazepin|topiramat|gabapentin|pregabalin|duloxetin|venlafaxin|sertralin|citalopram|escitalopram|fluoxetin|paroxetin|mirtazapin|trazodon|bupropion|vortioxetin|agomelatin|lithium)\b/gi;
  masked = masked.replace(medications, "[MASKERAD LÄKEMEDEL]");

  // Kroppsdelar och anatomiska termer
  const bodyParts = /\b(hjärta|lunga|lever|njure|mage|tarm|hjärna|ryggmärg|nerv|muskel|skelett|ben|led|hud|öga|öra|näsa|mun|tunga|tand|hals|bröst|buk|arm|ben|fot|hand|finger|tå|huvud|panna|kind|haka|käke|tänder|tunga|svalg|matstrupe|magsäck|tarm|tjocktarm|tuntarm|blindtarm|ändtarm|anal|urinblåsa|urinrör|njurbäcken|prostata|testikel|äggstock|livmoder|slida|vulva|klitoris|bröst|bröstvårta|bröstkörtel|lymfknuta|blodkärl|artär|vena|kapillär|hjärta|klaff|kammare|förmak|aorta|lungartär|lungven|pulmonal|systemisk|koronar|cerebral|perifer|central|autonom|sympatisk|parasympatisk|sensorisk|motorisk|visuell|auditiv|olfaktorisk|gustatorisk|taktil|nociceptiv|proprioceptiv|interoceptiv|exteroceptiv)\b/gi;
  masked = masked.replace(bodyParts, "[MASKERAD KROPPSDDEL]");

  // Tidsstämplar och datum (för att anonymisera tidpunkter)
  masked = masked.replace(/\b\d{4}-\d{2}-\d{2}\b/g, "[MASKERAT DATUM]");
  masked = masked.replace(/\b\d{2}\/\d{2}\/\d{4}\b/g, "[MASKERAT DATUM]");
  masked = masked.replace(/\b\d{2}-\d{2}-\d{4}\b/g, "[MASKERAT DATUM]");
  masked = masked.replace(/\b\d{2}:\d{2}\b/g, "[MASKERAD TID]");
  masked = masked.replace(/\b\d{2}:\d{2}:\d{2}\b/g, "[MASKERAD TID]");
  masked = masked.replace(/\b\d{1,2}\s+(januari|februari|mars|april|maj|juni|juli|augusti|september|oktober|november|december)\s+\d{4}\b/gi, "[MASKERAT DATUM]");
  masked = masked.replace(/\b\d{1,2}\s+(jan|feb|mar|apr|maj|jun|jul|aug|sep|okt|nov|dec)\s+\d{4}\b/gi, "[MASKERAT DATUM]");

  // Ålder och personlig information
  masked = masked.replace(/\b\d{1,3}\s+(år|års|åring|årig|åldern)\b/gi, "[MASKERAD ÅLDER]");
  masked = masked.replace(/\b(\d{1,2})\s+års\s+ålder\b/gi, "[MASKERAD ÅLDER]");
  masked = masked.replace(/\bfödd\s+\d{4}\b/gi, "[MASKERAD FÖDELSEÅR]");
  masked = masked.replace(/\bfödd\s+\d{2}-\d{2}\b/gi, "[MASKERAD FÖDELSEDATUM]");

  // Sjukvårdsplatser och avdelningar
  const healthcareLocations = /\b(akutmottagning|intensivvårdsavdelning|iva|medicinavdelning|kirurgavdelning|ortopedavdelning|neurologavdelning|psykiatravdelning|geriatriskavdelning|pediatriskavdelning|obstetrik|gynekologi|oncologi|radiologi|patologi|anestesi|operation|lab|mottagning|vårdscentral|primärvård|specialistvård|sjukhus|klinik|vårdscentral|hälsocentral|rehab|sjukgymnast|fysioterapi|ergoterapi|logoped|dietist|kurator|psykolog|psykiater|allmänläkare|specialistläkare|överläkare|undersköterska|sjuksköterska|leg\.sjuksköterska|läkare|doktor|professor|assistent|intern|resident|specialist|konsult)\b/gi;
  masked = masked.replace(healthcareLocations, "[MASKERAD PLATS]");

  // === SLUT PÅ SJUKVÅRDSSPECIFIK MASKERING ===

  // Gatuadresser (svensk och engelsk format)
  masked = masked.replace(
    /\b([A-ZÅÄÖ][a-zåäö]+(?:gatan|vägen|gränden|gärdet|liden|stigen|torget|road|street|avenue|drive|lane|boulevard))\s+\d+[A-Z]?\b/g,
    "[MASKERAD ADRESS]"
  );
  
  // Fler adressformat (nummer först)
  masked = masked.replace(
    /\b\d+[A-Z]?\s+([A-ZÅÄÖ][a-zåäö]+(?:gatan|vägen|gränden|gärdet|liden|stigen|torget|road|street|avenue|drive|lane|boulevard))\b/g,
    "[MASKERAD ADRESS]"
  );

  // Kontonummer (3-4 siffror - 4 siffror)
  masked = masked.replace(/\b\d{3,4}[-]\d{4}\b/g, "[MASKERAT KONTONR]");

  // Postnummer (svenskt format: XXX XX eller XXXXX)
  masked = masked.replace(/\b\d{3}\s?\d{2}\b/g, "[MASKERAT POSTNUMMER]");

  return masked;
}

/**
 * Identifierar känslig information med AI (för förhandsgranskning)
 * Returnerar lista med identifierade känsliga element
 */
export async function identifySensitiveData(
  text: string
): Promise<{ type: string; value: string; position: number }[]> {
  // Denna funktion kan utökas med AI-baserad identifiering
  // För nu returnerar vi regex-baserade träffar
  const sensitive: { type: string; value: string; position: number }[] = [];

  // Organisationsnummer (först för att undvika konflikter)
  const orgNrRegex = /\b(6[0-9]|7[0-9]|8[0-9]|9[0-9])\d{4}-\d{4}\b/g;
  let match;
  while ((match = orgNrRegex.exec(text)) !== null) {
    sensitive.push({
      type: "Organisationsnummer",
      value: match[0],
      position: match.index
    });
  }

  // Personnummer
  const personnummerRegex = /\b(\d{6}|\d{8})[-+]\d{4}\b/g;
  while ((match = personnummerRegex.exec(text)) !== null) {
    sensitive.push({
      type: "Personnummer",
      value: match[0],
      position: match.index
    });
  }

  // Telefonnummer (svenska)
  const phoneRegex = /\b(?:\+46|0)([\s-]?\d){2,3}[\s-]?\d{2,3}[\s-]?\d{2}[\s-]?\d{2}\b/g;
  while ((match = phoneRegex.exec(text)) !== null) {
    sensitive.push({
      type: "Telefonnummer",
      value: match[0],
      position: match.index
    });
  }

  // Internationella telefonnummer
  const intlPhoneRegex = /\b\+\d{1,3}[\s-]?\d{1,4}[\s-]?\d{1,4}[\s-]?\d{1,9}\b/g;
  while ((match = intlPhoneRegex.exec(text)) !== null) {
    sensitive.push({
      type: "Internationellt telefonnummer",
      value: match[0],
      position: match.index
    });
  }

  // E-post
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}/g;
  while ((match = emailRegex.exec(text)) !== null) {
    sensitive.push({
      type: "E-postadress",
      value: match[0],
      position: match.index
    });
  }

  // Adresser
  const addressRegex = /\b([A-ZÅÄÖ][a-zåäö]+(?:gatan|vägen|gränden|gärdet|liden|stigen|torget|road|street|avenue|drive|lane|boulevard))\s+\d+[A-Z]?\b/g;
  while ((match = addressRegex.exec(text)) !== null) {
    sensitive.push({
      type: "Adress",
      value: match[0],
      position: match.index
    });
  }

  return sensitive;
}
