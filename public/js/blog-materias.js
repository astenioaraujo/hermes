/* Índice do blog — uma entrada por matéria publicada.

   É a ÚNICA lista de matérias do site: blog.html monta a página a partir
   dela. Para publicar, criar public/blog/<slug>.html (a partir de
   docs/blog/modelo-materia.html) e acrescentar a entrada aqui.

   Campos:
     numero   sequencial, nunca reaproveitado (é a chave de busca "nº 7")
     slug     nome do arquivo em public/blog/, sem .html
     titulo   igual ao <h1> da matéria
     data     AAAA-MM-DD, dia da publicação
     resumo   uma ou duas frases para o cartão da lista
     chaves   palavras-chave, em minúsculas, sem acento repetido de grafia

   A ordem aqui não importa: a lista sai da mais nova para a mais antiga. */

window.MATERIAS = [
  {
    numero: 1,
    slug: 'um-passaro-na-mao',
    titulo: 'Um pássaro na mão',
    data: '2026-11-23',
    resumo: 'Um provérbio que atravessou 2.500 anos sem campanha nenhuma. O que ele ensina sobre decidir — e sobre comunicar uma ideia de modo que ela fique.',
    chaves: ['simplicidade', 'comunicação', 'tomada de decisão', 'provérbios']
  }
];
