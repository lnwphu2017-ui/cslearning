
function testGrouping(contentToProcess) {
  // Changed split from \n\n to \n
  const allParts = contentToProcess.split(/\n(?=\*\*)/).filter(p => p.trim() !== "");
  let introPartText = "";
  let sectionCandidates = [];
  let hasFoundFirstBox = false;

  allParts.forEach((part, idx) => {
    const trimmedPart = part.trim();
    if (!hasFoundFirstBox) {
      if (trimmedPart.startsWith('**บทที่') || trimmedPart.startsWith('**Lesson')) {
        introPartText += (introPartText ? '\n\n' : '') + trimmedPart;
      } else if (!trimmedPart.startsWith('**')) {
        introPartText += (introPartText ? '\n\n' : '') + trimmedPart;
      } else {
        hasFoundFirstBox = true;
        sectionCandidates.push(trimmedPart);
      }
    } else {
      sectionCandidates.push(trimmedPart);
    }
  });

  const groupedSections = [];

  sectionCandidates.forEach((part) => {
    const match = part.match(/^\*\*([^\*]+)\*\*(.*)/s);
    if (match) {
      // Changed to remove colons
      let header = match[1].replace(/^[* \s:]+|[* \s:]+$/g, '').trim();
      let rawBody = match[2];

      const hasEnglishParens = header.includes('(') && header.includes(')');
      const isExtensionPrefix = false; 
      const isRelatedToPrevious = false; 
      const isSentence = header.length > 100;
      const shouldStartNewBox = hasEnglishParens && !isExtensionPrefix && !isRelatedToPrevious && !isSentence;

      if (shouldStartNewBox || groupedSections.length === 0) {
        const firstNewlineMatch = rawBody.match(/^([^\n\r]*)([\n\r]+.*)?$/s);
        if (firstNewlineMatch) {
          const sameLineText = firstNewlineMatch[1];
          if (sameLineText.trim().length > 0) {
            rawBody = firstNewlineMatch[2] || "";
          }
        }
      }
      
      let body = rawBody.trim();

      // Filter out empty headers or just stars
      if (!header || header === "**") return;

      if (groupedSections.length > 0 && (!shouldStartNewBox)) {
        groupedSections[groupedSections.length - 1].body += `\n\n**${header}**\n${body}`;
      } else {
        groupedSections.push({ header, body });
      }
    } else if (groupedSections.length > 0) {
      const trimmed = part.trim();
      if (trimmed && trimmed !== "**") {
        groupedSections[groupedSections.length - 1].body += '\n\n' + trimmed;
      }
    }
  });

  return { introPartText, groupedSections };
}

const sample = `**หลอดสูญญากาศ (Vacuum Tubes):**
**จุดกำเนิดยุคอิเล็กทรอนิกส์และข้อจำกัดทางกายภาพ**
ในยุคแรกเริ่มของ...

**กลไกและข้อจำกัด:**
แม้จะคำนวณได้...

**`;

console.log(JSON.stringify(testGrouping(sample), null, 2));
