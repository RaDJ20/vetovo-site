exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const ANTHROPIC_API_KEY = process.env.special_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Clé API manquante' }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch(e) { return { statusCode: 400, body: JSON.stringify({ error: 'JSON invalide' }) }; }

  const { type, subject, lang, titre, contenu, targetLang } = body;

  let prompt = '';

  if (type === 'generate') {
    // Génération d'article
    const langInstructions = {
      fr: 'Rédigez l\'article en français.',
      en: 'Write the article in English.',
      ar: 'اكتب المقال باللغة العربية.'
    };
    prompt = `Tu es le Dr Abdelhakim DJEZZAR, vétérinaire expert en aviculture diplômé de l'École Vétérinaire d'Alfort, fondateur de VETOVO Consulting.

Rédige un article de blog professionnel sur : "${subject}"

${langInstructions[lang] || langInstructions.fr}

L'article doit :
- Avoir un titre accrocheur (commence par "TITRE: ")
- Avoir un résumé court de 2 phrases (commence par "RÉSUMÉ: ")
- Avoir un contenu structuré de 400-500 mots avec des sous-titres
- Être écrit avec l'autorité d'un expert vétérinaire avicole
- Donner des conseils pratiques aux éleveurs
- Mentionner l'approche préventive de VETOVO naturellement

Format :
TITRE: [titre]
RÉSUMÉ: [résumé]
CONTENU:
[contenu]`;

  } else if (type === 'translate') {
    // Traduction d'article
    const langNames = { fr: 'français', en: 'anglais', ar: 'arabe' };
    prompt = `Traduis ce contenu en ${langNames[targetLang] || targetLang}. Garde exactement le même format. Réponds UNIQUEMENT avec la traduction, sans commentaire.

TITRE: ${titre}
---
${contenu}`;
  } else {
    return { statusCode: 400, body: JSON.stringify({ error: 'Type invalide' }) };
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data.error?.message || 'Erreur API' })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ text: data.content[0].text })
    };

  } catch(err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
