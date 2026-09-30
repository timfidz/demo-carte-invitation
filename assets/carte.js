// Carte d'invitation : enveloppe, prénom de l'invité lu dans le lien, agenda, formulaire de réponse.
// Démonstration : le formulaire n'envoie rien, il affiche l'e-mail que l'organisateur recevrait.
(() => {
  const racine = document.documentElement
  const d = document.body.dataset
  const $ = (id) => document.getElementById(id)

  // ---- L'invité : ?invite=Prénom Nom dans le lien reçu
  const invite = (new URLSearchParams(location.search).get("invite") || "").trim().slice(0, 60)
  if (invite) {
    document.querySelectorAll("[data-invite]").forEach((e) => (e.textContent = invite))
    document.querySelector(".avec-nom").hidden = false
    document.querySelector(".sans-nom").hidden = true
    $("nom").value = invite
  }

  // ---- L'enveloppe
  const calme = matchMedia("(prefers-reduced-motion: reduce)").matches
  const ouvrir = () => {
    racine.classList.add("ouverte")
    scrollTo(0, 0)
    $("carte").querySelector("h1").setAttribute("tabindex", "-1")
    $("carte").querySelector("h1").focus({ preventScroll: true })
  }
  $("ouvrir").addEventListener("click", () => {
    if (calme) return ouvrir()
    $("enveloppe").classList.add("ouvre")
    $("ouvrir").disabled = true
    setTimeout(ouvrir, 1500)
  })
  if (location.hash === "#carte" || location.hash === "#reponse") ouvrir()

  // ---- Le compte à rebours, en jours
  const jours = Math.ceil((new Date(d.jour + "T00:00:00") - new Date()) / 864e5)
  if (jours > 0) {
    $("compte").textContent = jours === 1 ? "C'est demain" : "Dans " + jours + " jours"
    $("compte").hidden = false
  }

  // ---- L'agenda : le bouton ouvre une liste par-dessus la page (Google, Outlook, fichier .ics) ; sans script, les trois choix restent affichés
  const menu = $("agenda-menu")
  const bouton = $("agenda")
  const bascule = (ouvert) => {
    menu.hidden = !ouvert
    bouton.setAttribute("aria-expanded", String(ouvert))
  }
  bascule(false)
  bouton.addEventListener("click", () => bascule(menu.hidden))
  document.addEventListener("click", (e) => { if (!e.target.closest(".agenda-choix")) bascule(false) })
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !menu.hidden) { bascule(false); bouton.focus() }
  })
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) bascule(false) })

  // ---- Le formulaire
  const form = $("formulaire")
  let nombre = 1
  const affiche = () => ($("nombre").textContent = nombre)
  $("moins").addEventListener("click", () => { nombre = Math.max(1, nombre - 1); affiche() })
  $("plus").addEventListener("click", () => { nombre = Math.min(8, nombre + 1); affiche() })
  form.addEventListener("change", (e) => {
    if (e.target.name === "presence") $("si-oui").hidden = e.target.value !== "oui"
  })

  const ligne = (dl, nom, valeur) => {
    const dt = document.createElement("dt"); dt.textContent = nom
    const dd = document.createElement("dd"); dd.textContent = valeur
    dl.append(dt, dd)
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault()
    const f = new FormData(form)
    const nom = (f.get("nom") || "").trim()
    const presence = f.get("presence")
    const erreur = $("erreur")
    if (!nom || !presence) {
      erreur.textContent = !nom ? "Indiquez votre prénom et votre nom." : "Indiquez si vous serez présent."
      erreur.hidden = false
      ;(!nom ? $("nom") : form.querySelector("[name=presence]")).focus()
      return
    }
    erreur.hidden = true
    const vient = presence === "oui"
    const prenom = nom.split(" ")[0]

    $("merci-titre").textContent = "Merci " + prenom + ", votre réponse est envoyée."
    $("merci-texte").textContent = vient
      ? "Nous vous attendons, " + (nombre > 1 ? "à " + nombre + " personnes" : "avec plaisir") + "."
      : "Vous nous manquerez. Merci de nous avoir prévenus."

    $("mail-objet").textContent = "Réponse de " + nom + " : " + (vient ? "présent, " + nombre + (nombre > 1 ? " personnes" : " personne") : "absent")
    const dl = $("mail-corps")
    dl.textContent = ""
    ligne(dl, "Événement", d.evenement)
    ligne(dl, "Invité", nom)
    ligne(dl, "Réponse", vient ? d.oui : d.non)
    if (vient) ligne(dl, "Personnes", String(nombre))
    // les questions d'exemple : chaque réponse donnée devient une ligne de l'e-mail
    if (vient) form.querySelectorAll("[data-q]").forEach((q) => {
      const valeur = (f.get(q.dataset.nom) || "").trim()
      if (valeur) ligne(dl, q.dataset.q, valeur)
    })
    if (f.get("message").trim()) ligne(dl, "Message", f.get("message").trim())
    ligne(dl, "Reçue le", new Date().toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" }))

    form.hidden = true
    $("merci").hidden = false
    $("merci").focus()
  })

  $("modifier").addEventListener("click", () => {
    $("merci").hidden = true
    form.hidden = false
    $("nom").focus()
  })
})()
