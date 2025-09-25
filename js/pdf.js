const { jsPDF } = window.jspdf;
let fotoData = null;

document.addEventListener("DOMContentLoaded", () => {
    $('#escolaridade, #experiencia, #habilidades, #idiomas, #resumo, #cursos').summernote({
        height: 200,
        toolbar: [
            ['style', ['bold', 'italic', 'underline']],
            ['para', ['ul', 'ol']],
            ['insert', ['picture', 'link']],
            ['view', ['fullscreen']]
        ]
    });

    if (IMask) {
        IMask(document.getElementById("telefone"), { mask: "(00) 00000-0000" });
        IMask(document.getElementById("cpf"), { mask: "000.000.000-00" });
    }

    document.getElementById("foto").addEventListener("change", handleFotoUpload);
    document.getElementById("curriculoForm").addEventListener("submit", (e) => {
        e.preventDefault();
        generatePDF();
    });
});

function handleFotoUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (evt) {
            const img = new Image();
            img.onload = function () {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");

                // Desenhar imagem sem bordas
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);

                fotoData = canvas.toDataURL("image/png"); 
            };
            img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
}

function cleanHTML(html) {
    let tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    return tempDiv.innerText.replace(/\u00a0/g, " ").trim();
}

function getEditorContent(id) {
    return cleanHTML($('#' + id).summernote('code'));
}

function generatePDF() {
    const doc = new jsPDF();
    const margin = 20;
    const lineHeight = 7;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = margin;

    const formData = {
        nome: getValue("nome"),
        cargo: getValue("cargo"),
        email: getValue("email"),
        telefone: getValue("telefone"),
        cpf: getValue("cpf"),
        endereco: getValue("endereco"),
        linkedin: getValue("linkedin"),
        portfolio: getValue("portfolio"),
        resumo: getEditorContent("resumo"),
        escolaridade: getEditorContent("escolaridade"),
        experiencia: getEditorContent("experiencia"),
        habilidades: getEditorContent("habilidades"),
        idiomas: getEditorContent("idiomas"),
        cursos: getEditorContent("cursos")
    };

    y = addHeader(doc, formData, pageWidth, margin, y);
    y += 5;

    // Adicionar resumo profissional se existir
    if (formData.resumo) {
        y = addSection(doc, "Resumo Profissional", formData.resumo, pageWidth, pageHeight, margin, lineHeight, y);
    }

    y = addSection(doc, "Formação Acadêmica", formData.escolaridade, pageWidth, pageHeight, margin, lineHeight, y);
    y = addSection(doc, "Experiência Profissional", formData.experiencia, pageWidth, pageHeight, margin, lineHeight, y);
    y = addSection(doc, "Habilidades e Competências", formData.habilidades, pageWidth, pageHeight, margin, lineHeight, y);
    y = addSection(doc, "Idiomas", formData.idiomas, pageWidth, pageHeight, margin, lineHeight, y);
    y = addSection(doc, "Cursos e Certificações", formData.cursos, pageWidth, pageHeight, margin, lineHeight, y);

    const fileName = `Curriculo_${formData.nome.replace(/\s/g, "_")}.pdf`;
    doc.save(fileName);
    showNotification();
}

function addHeader(doc, data, pageWidth, margin, y) {
    const imgSize = 40;
    const headerHeight = 50;
    const padding = 10;

    doc.setFillColor(44, 62, 80);
    doc.rect(0, 0, pageWidth, headerHeight, "F");

    if (fotoData) {
        const fotoY = (headerHeight - imgSize) / 2;
        const fotoX = margin;
        doc.addImage(fotoData, "PNG", fotoX, fotoY, imgSize, imgSize);
    }

    const textX = margin + (fotoData ? imgSize + padding : 0);

    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, "bold");
    doc.text(data.nome, textX, padding + 10);

    doc.setFontSize(12);
    doc.setFont(undefined, "normal");
    
    // Adicionar cargo desejado
    if (data.cargo) {
        doc.text(data.cargo, textX, padding + 18);
    }
    
    doc.setFontSize(10);
    
    // Construir linha de contato
    let contactLine = data.email;
    if (data.telefone) contactLine += ` | ${data.telefone}`;
    if (data.cpf) contactLine += ` | CPF: ${data.cpf}`;
    
    doc.text(contactLine, textX, padding + 26);
    
    // Adicionar endereço
    if (data.endereco) {
        doc.text(data.endereco, textX, padding + 33);
    }
    
    // Adicionar links profissionais
    let linksY = padding + 40;
    if (data.linkedin) {
        doc.text(`LinkedIn: ${data.linkedin}`, textX, linksY);
        linksY += 7;
    }
    if (data.portfolio) {
        doc.text(`Portfólio: ${data.portfolio}`, textX, linksY);
    }

    return headerHeight + padding;
}

function addSection(doc, title, content, pageWidth, pageHeight, margin, lineHeight, y) {
    if (y > pageHeight - 40) {
        doc.addPage();
        y = margin;
    }

    // Verificar se há conteúdo para esta seção
    if (!content || content.trim() === "") {
        return y; // Pular seção vazia
    }

    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.setTextColor(44, 62, 80);
    doc.text(title, margin, y);
    y += lineHeight;

    doc.setDrawColor(44, 62, 80);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;

    doc.setFontSize(11);
    doc.setFont(undefined, "normal");
    doc.setTextColor(0, 0, 0);

    const lines = doc.splitTextToSize(content, pageWidth - 2 * margin);
    doc.text(lines, margin, y);
    y += lines.length * lineHeight + 10;

    return y;
}

function showNotification() {
    const notification = document.getElementById("notification");
    notification.classList.add("show");
    setTimeout(() => {
        notification.classList.remove("show");
    }, 3000);
}