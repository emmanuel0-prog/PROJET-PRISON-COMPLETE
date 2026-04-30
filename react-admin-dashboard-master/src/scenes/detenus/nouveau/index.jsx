import React, { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, useTheme, alpha, Button, Grid, Stack, Paper, 
  TextField, MenuItem, Divider, Snackbar, Alert, CircularProgress, Chip,
  FormControlLabel, Switch
} from "@mui/material";
import {
  AddAPhotoOutlined, FingerprintOutlined, GavelOutlined,
  SaveOutlined, BalanceOutlined, BusinessOutlined, 
  ArrowBackOutlined, ShieldOutlined, PersonOutlined, 
  EscalatorWarningOutlined, SchoolOutlined, WorkOutline, StraightenOutlined,
  MedicalServicesOutlined, ApartmentOutlined, ReportProblemOutlined
} from "@mui/icons-material";

// Import des images officielles (Assure-toi que les chemins sont corrects)
import sceauRdc from "../../../assets/gouvernement rdc.png"; 
import drapeauRdc from "../../../assets/rdc.png";
import api from "../../../api"; // Import de l'instance Axios sécurisée

// COULEURS OFFICIELLES RDC
const RDC_BLUE = "#007FFF";
const RDC_YELLOW = "#F7D618";
const RDC_RED = "#CE1021";

const EnregistrementDetenu = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const isDark = theme.palette.mode === "dark";
  const bc = isDark ? "#fff" : "#000";

  // --- ÉTATS ---
  const [imgSrc, setImgSrc] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prisons, setPrisons] = useState([]);
  const [parquets, setParquets] = useState([]); 
  const webcamRef = useRef(null);

  const [formData, setFormData] = useState({
    matricule: "",
    nom: "",
    postnom: "",
    prenom: "",
    sexe: "M",
    date_naissance: "",
    lieu_naissance: "",
    nationalite: "Congolaise",
    etat_civil: "CELIBATAIRE",
    nombre_enfants: 0,
    adresse_residence: "",
    profession: "",
    
    // Filiation (Modèle Django)
    nom_pere: "",
    nom_mere: "",
    
    // Contact d'urgence (Modèle Django)
    contact_urgence_nom: "",
    contact_urgence_tel: "",
    lien_parente: "",
    
    // Signalement Physique (Modèle Django)
    taille: "", // Remplace hauteur
    teint: "",
    pointure: "",
    signes_particuliers: "", // Remplace signes_distinctifs
    
    // Localisation & Logistique (Modèle Django)
    prison: "",
    etat: "PRÉSENT",
    regime_alimentaire: "Normal",
    pavillon_actuel: "",
    cellule_actuelle: "",
    est_dangereux: false, // NOUVEAU CHAMPS HAUTE SÉCURITÉ
    
    // Judiciaire
    statut_juridique: "PREVENU",
    autorite_judiciaire: "", 
    
    // --- CHAMPS FANTÔMES (Ne s'enregistrent pas en base) ---
    agent_saisie: "",
    notes_observation: ""
  });

  // --- CHARGEMENT DES DONNÉES ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resPrisons, resParquets] = await Promise.all([
          api.get("http://127.0.0.1:8000/api/prisons/"),
          api.get("http://127.0.0.1:8000/api/parquets/") // Si tu utilises toujours une table parquet
        ]);
        setPrisons(resPrisons.data);
        setParquets(resParquets.data);

        if (isEditMode) {
          const resDetenu = await api.get(`http://127.0.0.1:8000/api/detenus/${id}/`);
          const d = resDetenu.data;
          setFormData({
            ...formData,
            ...d,
            est_dangereux: d.est_dangereux || false,
          });
          if (d.photo) setImgSrc(d.photo);
        }
        setLoading(false);
      } catch (err) {
        console.error("Erreur d'initialisation", err);
        alert("Impossible de charger les données. Vérifiez que le serveur backend est allumé.");
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isEditMode]);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImgSrc(imageSrc);
    setShowCamera(false);
  }, [webcamRef]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => setImgSrc(reader.result);
    if (file) reader.readAsDataURL(file);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = type === "checkbox" ? checked : value;

    // FORCER LES MAJUSCULES POUR NOM, POSTNOM ET PRENOM
    if (["nom", "postnom", "prenom"].includes(name)) {
      finalValue = finalValue.toUpperCase();
    }

    setFormData({ ...formData, [name]: finalValue });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // On construit le payload EXACTEMENT comme le modèle Django l'attend
      // On ignore volontairement 'agent_saisie' et 'notes_observation'
      const payload = {
        matricule: formData.matricule,
        nom: formData.nom,
        postnom: formData.postnom,
        prenom: formData.prenom,
        sexe: formData.sexe,
        date_naissance: formData.date_naissance,
        lieu_naissance: formData.lieu_naissance,
        nationalite: formData.nationalite,
        etat_civil: formData.etat_civil,
        nombre_enfants: formData.nombre_enfants === "" ? 0 : parseInt(formData.nombre_enfants, 10),
        adresse_residence: formData.adresse_residence,
        profession: formData.profession,
        
        nom_pere: formData.nom_pere,
        nom_mere: formData.nom_mere,
        
        contact_urgence_nom: formData.contact_urgence_nom,
        contact_urgence_tel: formData.contact_urgence_tel,
        lien_parente: formData.lien_parente,
        
        taille: formData.taille === "" ? null : parseInt(formData.taille, 10),
        teint: formData.teint,
        pointure: formData.pointure === "" ? null : parseInt(formData.pointure, 10),
        signes_particuliers: formData.signes_particuliers,
        
        prison: formData.prison,
        etat: formData.etat,
        regime_alimentaire: formData.regime_alimentaire,
        pavillon_actuel: formData.pavillon_actuel,
        cellule_actuelle: formData.cellule_actuelle,
        est_dangereux: formData.est_dangereux, // Le booléen pour le danger
        
        statut_juridique: formData.statut_juridique, 
        autorite_judiciaire: formData.autorite_judiciaire,

        ...(imgSrc && imgSrc.startsWith("data:image") && { photo: imgSrc })
      };

      let response;
      if (isEditMode) {
        response = await api.put(`http://127.0.0.1:8000/api/detenus/${id}/`, payload);
      } else {
        if (!imgSrc) {
          alert("Erreur : La capture du portrait est obligatoire pour un nouvel enrôlement.");
          setLoading(false);
          return;
        }
        response = await api.post("http://127.0.0.1:8000/api/detenus/", payload);
      }

      if (response.status === 200 || response.status === 201) {
        setOpenSnackbar(true);
        setTimeout(() => navigate("/detenus/liste"), 2000);
      }
    } catch (error) {
      console.error("Erreur détaillée:", error.response?.data);
      alert("Erreur lors de l'enregistrement. Vérifiez les champs obligatoires.");
    } finally {
      setLoading(false);
    }
  };

  // STYLE POUR RENDRE LE TEXTE TRÈS LISIBLE POUR LES PLUS VIEUX
  const fieldStyle = { 
    "& .MuiFilledInput-root": { 
        borderRadius: 0, 
        bgcolor: alpha(bc, 0.05),
        fontSize: "1.2rem", // Écriture plus grande
        fontWeight: 700,    // Écriture plus grasse
    }, 
    "& .MuiInputLabel-root": {
        fontSize: "1rem",   // Labels plus grands
        fontWeight: 800,
        color: alpha(bc, 0.8)
    },
    mb: 1 
  };

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" height="100vh"><CircularProgress sx={{color: RDC_BLUE}} /></Box>;

  return (
    <Box sx={{ p: 4, bgcolor: theme.palette.background.default, minHeight: "100vh" }}>
      
      {/* BANDEAU NATIONAL AVEC LOGOS */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} sx={{ borderBottom: `4px solid ${bc}`, pb: 2, position: "relative" }}>
        
        <Box display="flex" alignItems="center" gap={2}>
          <img src={sceauRdc} alt="Sceau RDC" style={{ height: 80 }} />
          <Box>
            <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: "-1px", color: bc }}>
                RÉPUBLIQUE DÉMOCRATIQUE DU CONGO
            </Typography>
            <Typography variant="h6" fontWeight={800} sx={{ color: RDC_BLUE }}>
                MINISTÈRE DE LA JUSTICE ET GARDE DES SCEAUX
            </Typography>
            <Typography variant="subtitle2" fontWeight={900} sx={{ opacity: 0.6 }}>
                SNE / DIVISION DE L'INFORMATIQUE PÉNITENTIAIRE
            </Typography>
          </Box>
        </Box>

        <Box display="flex" alignItems="center" gap={3}>
            <img src={drapeauRdc} alt="Drapeau RDC" style={{ height: 60, border: "1px solid #ccc" }} />
            <Stack direction="row" spacing={2}>
                <Button size="large" variant="outlined" onClick={() => navigate(-1)} startIcon={<ArrowBackOutlined />} sx={{ border: `2px solid ${bc}`, color: bc, fontWeight: 900, borderRadius: 0, fontSize: "1rem" }}>RETOUR</Button>
                <Button size="large" variant="contained" onClick={handleSave} startIcon={<SaveOutlined />} sx={{ bgcolor: RDC_BLUE, color: "#fff", fontWeight: 900, borderRadius: 0, boxShadow: "none", fontSize: "1rem" }}>{isEditMode ? "METTRE À JOUR" : "ENREGISTRER"}</Button>
            </Stack>
        </Box>

        {/* Ligne tricolore */}
        <Box sx={{ position: "absolute", bottom: -4, left: 0, width: "100%", height: "4px", display: "flex" }}>
          <Box sx={{ flex: 1, bgcolor: RDC_BLUE }} /><Box sx={{ flex: 1, bgcolor: RDC_YELLOW }} /><Box sx={{ flex: 1, bgcolor: RDC_RED }} />
        </Box>
      </Box>

      <Typography variant="h3" fontWeight={900} sx={{ letterSpacing: "-2px", mb: 4 }}>
        {isEditMode ? "MODIFICATION DU DOSSIER DÉTENU" : "ENRÔLEMENT BIOMÉTRIQUE DÉTENU"}
      </Typography>

      <Grid container spacing={4}>
        
        {/* COLONNE GAUCHE : BIOMÉTRIE & SÉCURITÉ */}
        <Grid item xs={12} lg={3}>
          <Stack spacing={3}>
            {/* PHOTO */}
            <Paper sx={{ p: 3, border: `2px solid ${bc}`, borderRadius: 0, boxShadow: "none", position: "relative" }}>
              <Box sx={{ position: "absolute", top: 0, left: 0, width: "4px", height: "100%", bgcolor: RDC_BLUE }} />
              <Box sx={{ width: "100%", aspectRatio: "1/1", bgcolor: alpha(bc, 0.05), mb: 2, display: "flex", alignItems: "center", justifyContent: "center", border: `1px dashed ${bc}`, overflow: "hidden", position: "relative" }}>
                {showCamera ? (
                  <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" width="100%" />
                ) : imgSrc ? (
                  <>
                    <img src={imgSrc} alt="Capture" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    {imgSrc.startsWith("http") && <Chip label="PHOTO ARCHIVÉE" size="small" sx={{ position: "absolute", top: 5, right: 5, bgcolor: RDC_BLUE, color: "#fff", fontSize: "8px", fontWeight: 900 }} />}
                  </>
                ) : (
                  <Stack alignItems="center"><AddAPhotoOutlined sx={{ fontSize: 50, mb: 1, color: RDC_BLUE }} /><Typography variant="caption" fontWeight={900} fontSize="1rem">PORTRAIT</Typography></Stack>
                )}
              </Box>
              <Stack spacing={1}>
                <Button size="large" fullWidth variant="contained" onClick={() => showCamera ? capture() : setShowCamera(true)} sx={{ borderRadius: 0, bgcolor: showCamera ? RDC_RED : bc, fontWeight: 900, fontSize: "1.1rem" }}>
                    {showCamera ? "CAPTURER LA PHOTO" : "DÉMARRER CAMÉRA"}
                </Button>
                <Button component="label" fullWidth sx={{ color: bc, fontSize: "0.9rem", fontWeight: 800 }}>IMPORTER DEPUIS L'ORDINATEUR<input type="file" hidden accept="image/*" onChange={handleFileUpload} /></Button>
              </Stack>
            </Paper>

            {/* ALERTE HAUTE SÉCURITÉ (EST DANGEREUX) */}
            <Paper sx={{ p: 3, border: `3px solid ${formData.est_dangereux ? RDC_RED : bc}`, borderRadius: 0, boxShadow: "none", bgcolor: formData.est_dangereux ? alpha(RDC_RED, 0.1) : "transparent" }}>
                <Stack direction="row" alignItems="center" gap={1} mb={1}>
                    <ReportProblemOutlined sx={{ color: formData.est_dangereux ? RDC_RED : bc, fontSize: 30 }} />
                    <Typography variant="h6" fontWeight={900} color={formData.est_dangereux ? RDC_RED : bc}>NIVEAU DE SÉCURITÉ</Typography>
                </Stack>
                <FormControlLabel
                    control={
                        <Switch 
                            checked={formData.est_dangereux} 
                            onChange={handleChange} 
                            name="est_dangereux" 
                            color="error"
                            size="medium"
                            sx={{ transform: 'scale(1.5)', ml: 1, mr: 2 }} // Agrandir le switch pour les vieux
                        />
                    }
                    label={<Typography fontWeight={900} fontSize="1.2rem" color={formData.est_dangereux ? RDC_RED : bc}>PROFIL DANGEREUX</Typography>}
                />
            </Paper>

            {/* MENSURATIONS (Modifié pour correspondre au backend) */}
            <Paper sx={{ p: 3, border: `2px solid ${bc}`, borderRadius: 0, boxShadow: "none", position: "relative" }}>
              <Box sx={{ position: "absolute", top: 0, left: 0, width: "4px", height: "100%", bgcolor: RDC_YELLOW }} />
              <Typography variant="caption" fontSize="1rem" fontWeight={900} display="block" mb={2}>PHYSIQUE ET SANTÉ</Typography>
              <TextField fullWidth name="taille" label="TAILLE (CM)" type="number" value={formData.taille} onChange={handleChange} variant="filled" InputProps={{ disableUnderline: true, startAdornment: <StraightenOutlined sx={{mr:1}}/> }} sx={fieldStyle} />
              <TextField fullWidth name="teint" label="TEINT (Ex: Clair, Noir...)" value={formData.teint} onChange={handleChange} variant="filled" InputProps={{ disableUnderline: true }} sx={fieldStyle} />
              <TextField fullWidth name="pointure" label="POINTURE CHAUSSURE" type="number" value={formData.pointure} onChange={handleChange} variant="filled" InputProps={{ disableUnderline: true }} sx={fieldStyle} />
            </Paper>
          </Stack>
        </Grid>

        {/* COLONNE DROITE : FORMULAIRE COMPLET */}
        <Grid item xs={12} lg={9}>
          <Paper sx={{ p: 4, border: `2px solid ${bc}`, borderRadius: 0, boxShadow: "none" }}>
            
            {/* 1. ÉTAT CIVIL & IDENTITÉ */}
            <Typography variant="h5" fontWeight={900} mb={3} sx={{ display: "flex", alignItems: "center", gap: 1, color: RDC_BLUE }}><PersonOutlined fontSize="large" /> ÉTAT CIVIL ET IDENTITÉ</Typography>
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12} md={3}><TextField fullWidth name="matricule" value={formData.matricule} label="N° MATRICULE (Optionnel)" variant="filled" onChange={handleChange} InputProps={{ disableUnderline: true }} sx={fieldStyle} disabled={isEditMode} helperText="Généré auto si vide" /></Grid>
              <Grid item xs={12} md={3}><TextField fullWidth name="nom" value={formData.nom} label="NOM" variant="filled" onChange={handleChange} InputProps={{ disableUnderline: true }} sx={fieldStyle} /></Grid>
              <Grid item xs={12} md={3}><TextField fullWidth name="postnom" value={formData.postnom} label="POST-NOM" variant="filled" onChange={handleChange} InputProps={{ disableUnderline: true }} sx={fieldStyle} /></Grid>
              <Grid item xs={12} md={3}><TextField fullWidth name="prenom" value={formData.prenom} label="PRÉNOM" variant="filled" onChange={handleChange} InputProps={{ disableUnderline: true }} sx={fieldStyle} /></Grid>
              
              <Grid item xs={12} md={2}>
                <TextField select fullWidth name="sexe" label="SEXE" value={formData.sexe} onChange={handleChange} variant="filled" InputProps={{ disableUnderline: true }} sx={fieldStyle}>
                  <MenuItem value="M" sx={{ fontSize: "1.2rem" }}>Masculin</MenuItem>
                  <MenuItem value="F" sx={{ fontSize: "1.2rem" }}>Féminin</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={5}><TextField fullWidth name="nationalite" value={formData.nationalite} label="NATIONALITÉ" variant="filled" onChange={handleChange} InputProps={{ disableUnderline: true }} sx={fieldStyle} /></Grid>
              <Grid item xs={12} md={5}><TextField fullWidth name="lieu_naissance" value={formData.lieu_naissance} label="LIEU DE NAISSANCE" variant="filled" onChange={handleChange} InputProps={{ disableUnderline: true }} sx={fieldStyle} /></Grid>

              <Grid item xs={12} md={4}><TextField fullWidth name="date_naissance" value={formData.date_naissance} type="date" label="DATE DE NAISSANCE" onChange={handleChange} InputLabelProps={{ shrink: true }} variant="filled" InputProps={{ disableUnderline: true }} sx={fieldStyle} /></Grid>
              <Grid item xs={12} md={4}>
                <TextField select fullWidth name="etat_civil" label="ÉTAT CIVIL" value={formData.etat_civil} onChange={handleChange} variant="filled" InputProps={{ disableUnderline: true }} sx={fieldStyle}>
                  <MenuItem value="CELIBATAIRE" sx={{ fontSize: "1.2rem" }}>Célibataire</MenuItem>
                  <MenuItem value="MARIE" sx={{ fontSize: "1.2rem" }}>Marié(e)</MenuItem>
                  <MenuItem value="DIVORCE" sx={{ fontSize: "1.2rem" }}>Divorcé(e)</MenuItem>
                  <MenuItem value="VEUF" sx={{ fontSize: "1.2rem" }}>Veuf/Veuve</MenuItem>
                  <MenuItem value="UNION_LIBRE" sx={{ fontSize: "1.2rem" }}>Union Libre</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}><TextField fullWidth name="nombre_enfants" type="number" value={formData.nombre_enfants} label="NOMBRE D'ENFANTS" variant="filled" onChange={handleChange} InputProps={{ disableUnderline: true }} sx={fieldStyle} /></Grid>
              
              <Grid item xs={12}><TextField fullWidth name="adresse_residence" value={formData.adresse_residence} label="ADRESSE DE RÉSIDENCE (Dernière connue)" variant="filled" onChange={handleChange} InputProps={{ disableUnderline: true }} sx={fieldStyle} /></Grid>
            </Grid>

            {/* 2. FILIATION ET CONTACTS URGENCE */}
            <Typography variant="h5" fontWeight={900} mb={3} sx={{ display: "flex", alignItems: "center", gap: 1, color: bc }}><SchoolOutlined fontSize="large" /> FILIATION ET CONTACT D'URGENCE</Typography>
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12} md={6}><TextField fullWidth name="nom_pere" value={formData.nom_pere} label="NOM DU PÈRE" variant="filled" onChange={handleChange} InputProps={{ disableUnderline: true }} sx={fieldStyle} /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth name="nom_mere" value={formData.nom_mere} label="NOM DE LA MÈRE" variant="filled" onChange={handleChange} InputProps={{ disableUnderline: true }} sx={fieldStyle} /></Grid>
              <Grid item xs={12}><TextField fullWidth name="profession" value={formData.profession} label="PROFESSION AVANT INCARCÉRATION" variant="filled" onChange={handleChange} InputProps={{ disableUnderline: true, startAdornment: <WorkOutline sx={{mr:1}}/> }} sx={fieldStyle} /></Grid>
              
              <Grid item xs={12} md={4}><TextField fullWidth name="contact_urgence_nom" value={formData.contact_urgence_nom} label="NOM DU CONTACT D'URGENCE" variant="filled" onChange={handleChange} InputProps={{ disableUnderline: true, startAdornment: <EscalatorWarningOutlined sx={{mr:1}}/> }} sx={fieldStyle} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth name="lien_parente" value={formData.lien_parente} label="LIEN DE PARENTÉ (Ex: Épouse)" variant="filled" onChange={handleChange} InputProps={{ disableUnderline: true }} sx={fieldStyle} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth name="contact_urgence_tel" value={formData.contact_urgence_tel} label="TÉLÉPHONE DU CONTACT" variant="filled" onChange={handleChange} InputProps={{ disableUnderline: true }} sx={fieldStyle} /></Grid>
            </Grid>

            {/* 3. SIGNALEMENT ET SANTÉ */}
            <Typography variant="h5" fontWeight={900} mb={3} sx={{ display: "flex", alignItems: "center", gap: 1, color: RDC_BLUE }}><MedicalServicesOutlined fontSize="large" /> SIGNALEMENT ET SANTÉ</Typography>
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12}><TextField fullWidth name="signes_particuliers" value={formData.signes_particuliers} label="SIGNES PARTICULIERS (Cicatrices, Tatouages, Handicaps...)" variant="filled" multiline rows={3} onChange={handleChange} InputProps={{ disableUnderline: true }} sx={fieldStyle} /></Grid>
            </Grid>

            <Divider sx={{ mb: 4, borderBottom: `2px solid ${alpha(RDC_YELLOW, 0.4)}` }} />

            {/* 4. AFFECTATION ET STATUT */}
            <Typography variant="h5" fontWeight={900} mb={3} sx={{ display: "flex", alignItems: "center", gap: 1, color: RDC_YELLOW }}><ApartmentOutlined fontSize="large" /> LOCALISATION INTERNE ET DÉTENTION</Typography>
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12} md={6}>
                <TextField select fullWidth name="prison" label="PRISON D'ACCUEIL" value={formData.prison} onChange={handleChange} variant="filled" InputProps={{ disableUnderline: true }} sx={fieldStyle}>
                  <MenuItem value="" disabled sx={{ fontSize: "1.2rem" }}>Sélectionner une prison</MenuItem>
                  {prisons.map((p) => <MenuItem key={p.id} value={p.id} sx={{ fontSize: "1.2rem" }}>{p.nom}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField select fullWidth name="etat" label="ÉTAT DE PRÉSENCE" value={formData.etat} onChange={handleChange} variant="filled" InputProps={{ disableUnderline: true }} sx={fieldStyle}>
                  <MenuItem value="PRESENT">Présent</MenuItem><MenuItem value="EVADE">Évadé</MenuItem>
                  <MenuItem value="LIBERE">Libéré</MenuItem><MenuItem value="TRANSFERE">Transféré</MenuItem>
                  <MenuItem value="DECEDE">Décédé</MenuItem>
                </TextField>
              </Grid>
              
              <Grid item xs={12} md={4}><TextField fullWidth name="pavillon_actuel" value={formData.pavillon_actuel} label="PAVILLON ACTUEL" variant="filled" onChange={handleChange} InputProps={{ disableUnderline: true }} sx={fieldStyle} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth name="cellule_actuelle" value={formData.cellule_actuelle} label="CELLULE ACTUELLE" variant="filled" onChange={handleChange} InputProps={{ disableUnderline: true }} sx={fieldStyle} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth name="regime_alimentaire" value={formData.regime_alimentaire} label="RÉGIME ALIMENTAIRE" placeholder="Ex: Normal, Sans sel..." variant="filled" onChange={handleChange} InputProps={{ disableUnderline: true }} sx={fieldStyle} /></Grid>
            </Grid>

            <Divider sx={{ mb: 4, borderBottom: `2px solid ${alpha(RDC_RED, 0.4)}` }} />

            {/* 5. JUDICIAIRE */}
            <Typography variant="h5" fontWeight={900} mb={3} sx={{ display: "flex", alignItems: "center", gap: 1, color: RDC_RED }}><BalanceOutlined fontSize="large" /> DOSSIER JUDICIAIRE</Typography>
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12} md={6}>
                <TextField select fullWidth name="statut_juridique" label="STATUT JURIDIQUE ACTUEL" value={formData.statut_juridique} onChange={handleChange} variant="filled" InputProps={{ disableUnderline: true }} sx={fieldStyle}>
                  <MenuItem value="PREVENU" sx={{ fontSize: "1.2rem" }}>Prévenu</MenuItem>
                  <MenuItem value="DETENU_PREVENTIF" sx={{ fontSize: "1.2rem" }}>Détenu Préventif</MenuItem>
                  <MenuItem value="CONDAMNE" sx={{ fontSize: "1.2rem" }}>Condamné</MenuItem>

                  <MenuItem value="CONDAMNE_PREVENTIF" sx={{ fontSize: "1.2rem" }}>Condamné Préventif</MenuItem>
                  <MenuItem value="LIBERE" sx={{ fontSize: "1.2rem" }}>Libéré / Expiré</MenuItem>

                  <MenuItem value="MORT" sx={{ fontSize: "1.2rem" }}>Mort en détention</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}><TextField fullWidth name="autorite_judiciaire" value={formData.autorite_judiciaire} label="AUTORITÉ JUDICIAIRE (Ex: TGI Gombe)" onChange={handleChange} variant="filled" InputProps={{ disableUnderline: true }} sx={fieldStyle} /></Grid>
            </Grid>

            <Divider sx={{ mb: 4, borderBottom: `2px solid ${alpha(bc, 0.2)}` }} />

            {/* 6. CHAMPS FANTÔMES (Brouillon UI - non sauvegardés en base de données) */}
            <Typography variant="h5" fontWeight={900} mb={3} sx={{ display: "flex", alignItems: "center", gap: 1, color: "gray" }}><WorkOutline fontSize="large" /> ZONE RÉSERVÉE À L'ADMINISTRATION (Ne s'enregistre pas)</Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}><TextField fullWidth name="agent_saisie" value={formData.agent_saisie} label="NOM DE L'AGENT DE SAISIE" variant="filled" onChange={handleChange} InputProps={{ disableUnderline: true }} sx={{ ...fieldStyle, "& .MuiFilledInput-root": { bgcolor: alpha(RDC_YELLOW, 0.1), fontSize: "1.2rem", fontWeight: 700 } }} /></Grid>
                <Grid item xs={12} md={8}><TextField fullWidth name="notes_observation" value={formData.notes_observation} label="NOTES TEMPORAIRES (Brouillon)" variant="filled" multiline rows={2} onChange={handleChange} InputProps={{ disableUnderline: true }} sx={{ ...fieldStyle, "& .MuiFilledInput-root": { bgcolor: alpha(RDC_YELLOW, 0.1), fontSize: "1.2rem", fontWeight: 700 } }} /></Grid>
            </Grid>

          </Paper>
        </Grid>
      </Grid>

      <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={() => setOpenSnackbar(false)}>
        <Alert severity="success" sx={{ bgcolor: RDC_BLUE, color: "#fff", fontWeight: 900, fontSize: "1.2rem", borderRadius: 0 }}>
          SYSTÈME RDC : DOSSIER VALIDÉ ET ENREGISTRÉ DANS LA BASE NATIONALE !
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EnregistrementDetenu;