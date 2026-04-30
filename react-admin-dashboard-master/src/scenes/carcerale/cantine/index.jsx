import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Box, Typography, useTheme, alpha, Button, Grid, 
  Stack, Paper, IconButton, TextField, InputAdornment, 
  Chip, LinearProgress, Snackbar, Alert, MenuItem, Select, FormControl, InputLabel
} from "@mui/material";
import { DataGrid, frFR } from "@mui/x-data-grid";
import { useReactToPrint } from "react-to-print"; 
import {
  Inventory2Outlined,
  SearchOutlined,
  HistoryOutlined,
  PrintOutlined,
  FlagOutlined,
  AddBoxOutlined,
  IndeterminateCheckBoxOutlined,
  WarningAmberOutlined,
  CheckCircleOutline
} from "@mui/icons-material";
import api from "../../../api";

// URL DE BASE DE TON API DJANGO (À adapter côté backend)
const API_URL = "/stocks";

// --- COMPOSANT REÇU OFFICIEL (Bon de Mouvement) ---
const OfficialReceipt = React.forwardRef(({ transaction }, ref) => {
  if (!transaction) return null;

  const isEntree = transaction.type === "ENTRÉE";

  return (
    <div ref={ref} style={{ padding: "20px", width: "80mm", fontFamily: "Courier New, monospace", color: "#000", backgroundColor: "#fff" }}>
      {/* EN-TÊTE */}
      <div style={{ textAlign: "center", marginBottom: "15px" }}>
        <h4 style={{ margin: 0, fontSize: "12px", fontWeight: 900 }}>RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</h4>
        <p style={{ margin: 0, fontSize: "10px", fontWeight: 700 }}>MINISTÈRE DE LA JUSTICE</p>
        <p style={{ margin: 0, fontSize: "10px" }}>INTENDANCE PÉNITENTIAIRE</p>
        <p style={{ margin: "5px 0", fontSize: "10px" }}>--------------------------------</p>
      </div>

      <div style={{ textAlign: "center", marginBottom: "10px" }}>
        <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "bold", textDecoration: "underline" }}>
          BON DE {transaction.type}
        </h3>
      </div>

      {/* INFO TRANSACTION */}
      <div style={{ fontSize: "10px", marginBottom: "10px" }}>
        <p style={{ margin: "2px 0" }}><strong>DATE :</strong> {new Date().toLocaleString()}</p>
        <p style={{ margin: "2px 0" }}><strong>ID MVT :</strong> #{transaction.id_trans || "---"}</p>
        <p style={{ margin: "2px 0" }}><strong>OPÉRATEUR :</strong> {transaction.operateur || "INTENDANT"}</p>
      </div>

      <div style={{ borderBottom: "1px dashed #000", margin: "10px 0" }}></div>

      {/* DÉTAILS DE L'ARTICLE */}
      <div style={{ fontSize: "11px", marginBottom: "10px" }}>
        <p style={{ margin: "4px 0" }}><strong>ARTICLE :</strong> {transaction.article_nom}</p>
        <p style={{ margin: "4px 0" }}><strong>CATÉGORIE :</strong> {transaction.categorie}</p>
        <p style={{ margin: "4px 0", fontSize: "12px" }}>
          <strong>QUANTITÉ {isEntree ? "AJOUTÉE" : "RETIRÉE"} :</strong> {isEntree ? "+" : "-"}{transaction.quantite} {transaction.unite}
        </p>
        <p style={{ margin: "4px 0" }}><strong>MOTIF/DEST. :</strong> {transaction.motif.toUpperCase()}</p>
      </div>

      <div style={{ borderBottom: "1px dashed #000", margin: "10px 0" }}></div>

      {/* PIED DE PAGE */}
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <p style={{ fontSize: "8px", fontStyle: "italic", margin: 0 }}>Document officiel d'inventaire.</p>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "15px", fontSize: "9px", fontWeight: "bold" }}>
          <div style={{ borderTop: "1px solid #000", paddingTop: "5px", width: "45%", textAlign: "center" }}>VISA INTENDANT</div>
          <div style={{ borderTop: "1px solid #000", paddingTop: "5px", width: "45%", textAlign: "center" }}>VISA {isEntree ? "LIVREUR" : "RÉCEPTEUR"}</div>
        </div>
      </div>
    </div>
  );
});

// --- COMPOSANT PRINCIPAL ---
const GestionStocks = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  
  // Couleurs Officielles RDC
  const RDC_BLUE = "#007FFF"; 
  const RDC_YELLOW = "#F7D618";
  const RDC_RED = "#CE1021";
  const bc = isDark ? "#fff" : "#000";
  const paperBg = theme.palette.background.paper;

  // --- ÉTATS ---
  const [searchTerm, setSearchTerm] = useState("");
  const [inventory, setInventory] = useState([]); // Liste des articles
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ open: false, message: "", severity: "success" });
  const [lastTransaction, setLastTransaction] = useState(null);

  // Formulaire de Mouvement
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [mvtType, setMvtType] = useState("SORTIE"); // ENTRÉE ou SORTIE
  const [mvtQty, setMvtQty] = useState("");
  const [mvtMotif, setMvtMotif] = useState("");

  // --- EFFETS ---
  // Charger l'inventaire au démarrage
  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = () => {
    // Remplacer par ton vrai endpoint
    api.get(`${API_URL}/articles/`)
      .then(res => setInventory(res.data))
      .catch(err => {
        console.error("Erreur chargement inventaire:", err);
        // Données fictives de test si l'API n'est pas prête
        setInventory([
          { id: 1, nom: "Riz (Sacs 50kg)", categorie: "Alimentation", quantite: 120, seuil_alerte: 20, unite: "Sacs" },
          { id: 2, nom: "Paracétamol", categorie: "Médical", quantite: 15, seuil_alerte: 50, unite: "Boîtes" },
          { id: 3, nom: "Uniformes Détenus", categorie: "Équipement", quantite: 500, seuil_alerte: 100, unite: "Unités" },
          { id: 4, nom: "Haricots", categorie: "Alimentation", quantite: 5, seuil_alerte: 30, unite: "Sacs" },
        ]);
      });
  };

  // --- LOGIQUE IMPRESSION ---
  const componentRef = useRef();
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  // --- VALIDATION MOUVEMENT ---
  const handleMouvement = () => {
    if (!selectedArticle || !mvtQty || isNaN(mvtQty) || mvtQty <= 0 || !mvtMotif) {
      setFeedback({ open: true, message: "Veuillez remplir tous les champs correctement.", severity: "warning" });
      return;
    }

    if (mvtType === "SORTIE" && parseInt(mvtQty) > selectedArticle.quantite) {
      setFeedback({ open: true, message: "Stock insuffisant pour cette sortie !", severity: "error" });
      return;
    }

    setLoading(true);

    const payload = {
      article_id: selectedArticle.id,
      type_mouvement: mvtType,
      quantite: parseInt(mvtQty),
      motif: mvtMotif
    };

    // Remplacer par ton vrai endpoint de création de mouvement
    api.post(`${API_URL}/mouvement/`, payload)
      .then(res => {
        const data = res.data;
        
        // Préparer le reçu
        setLastTransaction({
          id_trans: data.transaction_id || Math.floor(Math.random() * 100000), // Faux ID pour le test
          type: mvtType,
          article_nom: selectedArticle.nom,
          categorie: selectedArticle.categorie,
          quantite: mvtQty,
          unite: selectedArticle.unite,
          motif: mvtMotif
        });

        // Feedback & Impression
        setFeedback({ open: true, message: "Mouvement enregistré avec succès !", severity: "success" });
        
        // Rafraichir le tableau et réinitialiser le formulaire
        fetchInventory();
        setMvtQty("");
        setMvtMotif("");
        setSelectedArticle(null);

        setTimeout(() => {
          handlePrint();
        }, 500);
      })
      .catch(err => {
        // En cas d'erreur de l'API (ou pour simuler le succès sans API)
        const newQty = mvtType === "ENTRÉE" 
          ? selectedArticle.quantite + parseInt(mvtQty) 
          : selectedArticle.quantite - parseInt(mvtQty);
        
        // Simulation locale du state si pas d'API
        setInventory(inventory.map(item => item.id === selectedArticle.id ? { ...item, quantite: newQty } : item));
        setLastTransaction({ id_trans: "SIM-" + Date.now().toString().slice(-4), type: mvtType, article_nom: selectedArticle.nom, categorie: selectedArticle.categorie, quantite: mvtQty, unite: selectedArticle.unite, motif: mvtMotif });
        setFeedback({ open: true, message: "[Mode Local] Mouvement enregistré.", severity: "success" });
        setMvtQty(""); setMvtMotif(""); setSelectedArticle(null);
        setTimeout(() => handlePrint(), 500);
      })
      .finally(() => setLoading(false));
  };

  // Filtrage
  const filteredInventory = inventory.filter(item => 
    item.nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.categorie.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats rapides
  const articlesEnRupture = inventory.filter(i => i.quantite <= i.seuil_alerte).length;

  // --- COLONNES DU TABLEAU ---
  const columns = [
    { field: "nom", headerName: "DÉSIGNATION ARTICLE", flex: 1.5, renderCell: (p) => (
      <Typography variant="body2" fontWeight={900} sx={{ textTransform: "uppercase" }}>{p.value}</Typography>
    )},
    { field: "categorie", headerName: "CATÉGORIE", width: 150, renderCell: (p) => (
      <Chip label={p.value} size="small" sx={{ fontWeight: 900, borderRadius: 0, bgcolor: alpha(bc, 0.1) }} />
    )},
    { field: "quantite", headerName: "EN STOCK", width: 140, renderCell: (p) => {
      const isCritical = p.value <= p.row.seuil_alerte;
      return (
        <Stack direction="row" alignItems="center" spacing={1}>
          {isCritical ? <WarningAmberOutlined sx={{ color: RDC_RED, fontSize: 18 }} /> : <CheckCircleOutline sx={{ color: "success.main", fontSize: 18 }} />}
          <Typography fontWeight={1000} sx={{ color: isCritical ? RDC_RED : "success.main" }}>
            {p.value} {p.row.unite}
          </Typography>
        </Stack>
      );
    }}
  ];

  return (
    <Box sx={{ p: 4, bgcolor: theme.palette.background.default, minHeight: "100vh", color: bc }}>
      
      {/* HEADER SECTION */}
      <Box sx={{ mb: 6, borderBottom: `8px solid ${RDC_BLUE}`, pb: 2, position: "relative" }}>
        <Box sx={{ position: "absolute", top: -10, left: 0, width: 40, height: 4, bgcolor: RDC_YELLOW }} />
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <Stack direction="row" spacing={2} alignItems="center">
              <Inventory2Outlined sx={{ fontSize: 50, color: RDC_BLUE }} />
              <Box>
                <Typography variant="h2" fontWeight={1000} sx={{ letterSpacing: "-2px", lineHeight: 1 }}>
                  INTENDANCE <span style={{ color: RDC_YELLOW }}>& STOCKS</span>
                </Typography>
                <Typography variant="caption" fontWeight={900} sx={{ opacity: 0.6, letterSpacing: 2 }}>
                  GESTION GLOBALE DES APPROVISIONNEMENTS
                </Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" startIcon={<HistoryOutlined />} sx={{ border: `2px solid ${bc}`, color: bc, fontWeight: 900, borderRadius: 0 }}>HISTORIQUE MVT</Button>
            </Stack>
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={4}>
        
        {/* COLONNE GAUCHE : INVENTAIRE */}
        <Grid item xs={12} lg={8}>
          <Stack spacing={4}>
            
            {/* STATS RAPIDES */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 3, border: `2px solid ${bc}`, borderRadius: 0, position: "relative" }}>
                  <Box sx={{ position: "absolute", top: 0, left: 0, width: "100%", height: 4, bgcolor: RDC_BLUE }} />
                  <Typography variant="h6" fontWeight={1000}>TOTAL RÉFÉRENCES</Typography>
                  <Typography variant="h3" fontWeight={1000} color={RDC_BLUE}>{inventory.length}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 3, border: `2px solid ${RDC_RED}`, borderRadius: 0, position: "relative", bgcolor: alpha(RDC_RED, 0.05) }}>
                  <Box sx={{ position: "absolute", top: 0, left: 0, width: "100%", height: 4, bgcolor: RDC_RED }} />
                  <Typography variant="h6" fontWeight={1000} color={RDC_RED}>ALERTES RUPTURE</Typography>
                  <Typography variant="h3" fontWeight={1000} color={RDC_RED}>{articlesEnRupture}</Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* TABLEAU INVENTAIRE */}
            <Box sx={{ border: `2px solid ${bc}`, bgcolor: paperBg, minHeight: 400 }}>
              <Box p={2} sx={{ bgcolor: bc, color: theme.palette.background.paper }} display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="button" fontWeight={900}>BASE DE DONNÉES INVENTAIRE</Typography>
                <TextField 
                  size="small"
                  placeholder="Filtrer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{ bgcolor: paperBg, borderRadius: 0, width: 250 }}
                  InputProps={{ startAdornment: <SearchOutlined sx={{ color: bc, mr: 1 }}/> }}
                />
              </Box>
              
              <DataGrid
                rows={filteredInventory}
                columns={columns}
                localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
                hideFooter
                autoHeight
                onRowClick={(params) => setSelectedArticle(params.row)} // Sélectionner pour le panneau de droite
                sx={{ 
                  border: "none", cursor: "pointer",
                  "& .MuiDataGrid-row:hover": { bgcolor: alpha(RDC_BLUE, 0.1) },
                  "& .MuiDataGrid-columnHeaders": { borderBottom: `3px solid ${RDC_BLUE}`, fontWeight: 1000 },
                  "& .MuiDataGrid-cell": { borderBottom: `1px solid ${alpha(bc, 0.1)}` }
                }}
              />
            </Box>
          </Stack>
        </Grid>

        {/* COLONNE DROITE : FORMULAIRE DE MOUVEMENT */}
        <Grid item xs={12} lg={4}>
          <Paper variant="outlined" sx={{ p: 4, border: `3px solid ${RDC_BLUE}`, borderRadius: 0, bgcolor: paperBg, position: "sticky", top: 20 }}>
            <Stack spacing={3}>
              <Box borderBottom={`2px dashed ${bc}`} pb={2}>
                <Typography variant="h6" fontWeight={1000} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  MOUVEMENT DE STOCK
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>Cliquez sur un article dans la grille pour commencer.</Typography>
              </Box>

              {!selectedArticle ? (
                <Box sx={{ p: 4, textAlign: "center", border: `1px dashed ${bc}`, opacity: 0.5 }}>
                  <Inventory2Outlined sx={{ fontSize: 40, mb: 1 }} />
                  <Typography fontWeight={900}>AUCUN ARTICLE SÉLECTIONNÉ</Typography>
                </Box>
              ) : (
                <Box sx={{ p: 2, bgcolor: alpha(RDC_BLUE, 0.05), border: `1px solid ${RDC_BLUE}` }}>
                  <Typography variant="caption" fontWeight={900} color={RDC_BLUE}>ARTICLE CIBLE :</Typography>
                  <Typography variant="h6" fontWeight={1000}>{selectedArticle.nom}</Typography>
                  <Typography variant="body2" fontWeight={900}>Stock actuel : {selectedArticle.quantite} {selectedArticle.unite}</Typography>
                </Box>
              )}

              {/* FORMULAIRE */}
              <FormControl fullWidth disabled={!selectedArticle}>
                <InputLabel>Type d'opération</InputLabel>
                <Select value={mvtType} label="Type d'opération" onChange={(e) => setMvtType(e.target.value)}>
                  <MenuItem value="ENTRÉE" sx={{ fontWeight: 900, color: "success.main" }}>
                    <AddBoxOutlined sx={{ mr: 1, fontSize: 18 }} /> ENTRÉE (Livraison)
                  </MenuItem>
                  <MenuItem value="SORTIE" sx={{ fontWeight: 900, color: RDC_RED }}>
                    <IndeterminateCheckBoxOutlined sx={{ mr: 1, fontSize: 18 }} /> SORTIE (Distribution)
                  </MenuItem>
                </Select>
              </FormControl>

              <TextField 
                label="Quantité" 
                type="number" 
                fullWidth 
                disabled={!selectedArticle}
                value={mvtQty}
                onChange={(e) => setMvtQty(e.target.value)}
                InputProps={{
                  endAdornment: <InputAdornment position="end">{selectedArticle?.unite || ""}</InputAdornment>,
                  inputProps: { min: 1 }
                }}
              />

              <TextField 
                label={mvtType === "ENTRÉE" ? "Fournisseur / Origine" : "Destinataire / Pavillon"} 
                fullWidth 
                disabled={!selectedArticle}
                value={mvtMotif}
                onChange={(e) => setMvtMotif(e.target.value)}
                placeholder={mvtType === "ENTRÉE" ? "Ex: PAM, Fournisseur Local..." : "Ex: Cuisines, Infirmerie, Pavillon A..."}
              />

              <Button 
                fullWidth 
                variant="contained" 
                disabled={!selectedArticle || loading}
                onClick={handleMouvement}
                sx={{ 
                  bgcolor: mvtType === "ENTRÉE" ? "success.main" : RDC_RED, 
                  color: "#fff", py: 2, fontWeight: 1000, 
                  borderRadius: 0, boxShadow: "none",
                  "&:hover": { filter: "brightness(0.8)" }
                }}
              >
                {loading ? "TRAITEMENT..." : `VALIDER LA ${mvtType} & IMPRIMER`}
              </Button>

              <Box sx={{ textAlign: "center", opacity: 0.4 }}>
                <FlagOutlined />
                <Typography variant="caption" fontWeight={900} sx={{ display: "block" }}>
                  TRAÇABILITÉ SÉCURISÉE DES STOCKS
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* --- NOTIFICATIONS --- */}
      <Snackbar open={feedback.open} autoHideDuration={6000} onClose={() => setFeedback({...feedback, open: false})}>
        <Alert severity={feedback.severity} variant="filled" sx={{ width: '100%', fontWeight: 'bold', borderRadius: 0 }}>
          {feedback.message}
        </Alert>
      </Snackbar>

      {/* --- ZONE D'IMPRESSION CACHÉE --- */}
      <div style={{ display: "none" }}>
        {lastTransaction && <OfficialReceipt ref={componentRef} transaction={lastTransaction} />}
      </div>
    </Box>
  );
};

export default GestionStocks;