import React, { useState, useEffect } from "react";
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, Button, 
  CircularProgress, Stack, alpha, TextField, MenuItem 
} from "@mui/material";
import { 
  WarningAmberOutlined, 
  NotificationImportantOutlined, 
  GavelOutlined,
  HistoryOutlined,
  DescriptionOutlined,
  FilterListOutlined
} from "@mui/icons-material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";
import api from "../../../api";

// COULEURS OFFICIELLES RDC
const RDC_RED = "#CE1021";
const RDC_BLUE = "#007FFF";
const RDC_YELLOW = "#F7D618";

const AlertesEcheances = () => {
  const navigate = useNavigate();
  
  // ÉTATS
  const [alertes, setAlertes] = useState([]);
  const [parquets, setParquets] = useState([]);
  const [filtreParquet, setFiltreParquet] = useState("TOUS");
  const [loading, setLoading] = useState(true);

  // CHARGEMENT INITIAL
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [resAlertes, resParquets] = await Promise.all([
          api.get("http://127.0.0.1:8000/api/documents-ecrou/?type=ODP&proche_expiration=true"),
          api.get("http://127.0.0.1:8000/api/parquets/")
        ]);
        
        // Tri par date d'expiration (le plus urgent en haut)
        const sorted = resAlertes.data.sort((a, b) => new Date(a.date_expiration) - new Date(b.date_expiration));
        setAlertes(sorted);
        setParquets(resParquets.data);
      } catch (err) {
        console.error("Erreur de chargement", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // LOGIQUE DE FILTRAGE
  const alertesFiltrees = alertes.filter(doc => 
    filtreParquet === "TOUS" || doc.parquet_emetteur === filtreParquet
  );

  // FONCTION DE GÉNÉRATION PDF (FORMAT OFFICIEL)
  const genererPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4'); // Mode Paysage
    const dateGen = new Date().toLocaleDateString("fr-FR");
    const nomParquet = filtreParquet === "TOUS" ? "TOUS LES PARQUETS" : parquets.find(p => p.id === filtreParquet)?.nom;

    // Entête RDC
    doc.setFontSize(10);
    doc.text("RÉPUBLIQUE DÉMOCRATIQUE DU CONGO", 148, 12, { align: "center" });
    doc.text("MINISTÈRE DE LA JUSTICE", 148, 17, { align: "center" });
    doc.text("ADMINISTRATION PÉNITENTIAIRE", 148, 22, { align: "center" });
    doc.line(110, 24, 186, 24);

    // Titre
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`BORDEREAU D'ALERTE : ${nomParquet}`, 148, 35, { align: "center" });

    // Table
    const rows = alertesFiltrees.map(item => [
      item.detenu_nom_complet.toUpperCase(),
      item.numero_document,
      item.parquet_nom || "Non spécifié",
      new Date(item.date_expiration).toLocaleString("fr-FR"),
      new Date(item.date_expiration) < new Date() ? "EXPIRÉ" : "À RÉGULARISER"
    ]);

    doc.autoTable({
      startY: 45,
      head: [['NOM ET POSTNOM DU DÉTENU', 'N° ODP', 'PARQUET', 'EXPIRATION', 'OBSERVATION']],
      body: rows,
      headStyles: { fillColor: [206, 16, 33] },
      styles: { fontSize: 9 }
    });

    // Signature
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.text("Le Greffier Titulaire,", 230, finalY);
    doc.rect(225, finalY + 5, 50, 20); // Cadre signature

    doc.save(`ALERTE_ODP_${dateGen}.pdf`);
  };

  // CALCUL DE L'URGENCE POUR LE STYLE
  const getUrgencyInfo = (dateExp) => {
    const diff = new Date(dateExp) - new Date();
    if (diff < 0) return { label: "EXPIRÉ", color: "#000", bg: "#e0e0e0" };
    if (diff < 12 * 3600000) return { label: "CRITIQUE (-12H)", color: "#fff", bg: RDC_RED };
    return { label: "URGENT (-48H)", color: "#000", bg: RDC_YELLOW };
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 4, bgcolor: "#fdfdfd", minHeight: "100vh" }}>
      
      {/* HEADER & ACTIONS */}
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={900} sx={{ color: RDC_RED, display: 'flex', alignItems: 'center', gap: 2 }}>
            <NotificationImportantOutlined fontSize="large" /> ALERTES ODP
          </Typography>
          <Typography variant="body1" color="textSecondary" fontWeight={600}>
            Délais de détention préventive arrivant à échéance
          </Typography>
        </Box>

        <Stack direction="row" spacing={2}>
          <TextField
            select
            size="small"
            label="FILTRER PAR PARQUET"
            value={filtreParquet}
            onChange={(e) => setFiltreParquet(e.target.value)}
            sx={{ minWidth: 200, bgcolor: "white" }}
            InputProps={{ startAdornment: <FilterListOutlined sx={{ mr: 1, color: "gray" }} /> }}
          >
            <MenuItem value="TOUS">Tous les Parquets</MenuItem>
            {parquets.map(p => <MenuItem key={p.id} value={p.id}>{p.nom}</MenuItem>)}
          </TextField>

          <Button 
            variant="contained" 
            onClick={genererPDF}
            startIcon={<DescriptionOutlined />}
            sx={{ bgcolor: "#000", borderRadius: 0, fontWeight: 900, px: 3, "&:hover": { bgcolor: "#333" } }}
          >
            IMPRIMER BORDEREAU
          </Button>
        </Stack>
      </Stack>

      {/* TABLEAU */}
      <TableContainer component={Paper} sx={{ borderRadius: 0, border: "2px solid #000", boxShadow: "none" }}>
        <Table>
          <TableHead sx={{ bgcolor: "#000" }}>
            <TableRow>
              <TableCell sx={{ color: "#fff", fontWeight: 800 }}>DÉTENU</TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: 800 }}>RÉFÉRENCE ODP</TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: 800 }}>PARQUET</TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: 800 }}>ÉCHÉANCE</TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: 800 }}>URGENCE</TableCell>
              <TableCell align="right" sx={{ color: "#fff", fontWeight: 800 }}>ACTION</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {alertesFiltrees.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 8 }}>Aucun dossier en alerte pour ce filtre.</TableCell></TableRow>
            ) : (
              alertesFiltrees.map((doc) => {
                const urgency = getUrgencyInfo(doc.date_expiration);
                return (
                  <TableRow key={doc.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={800}>{doc.detenu_nom_complet.toUpperCase()}</Typography>
                      <Typography variant="caption" color="textSecondary">Matricule: {doc.detenu_matricule}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{doc.numero_document}</TableCell>
                    <TableCell>{doc.parquet_nom || "N/A"}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={800} color={urgency.bg === RDC_RED ? RDC_RED : "inherit"}>
                        {new Date(doc.date_expiration).toLocaleString('fr-FR')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={urgency.label} 
                        sx={{ bgcolor: urgency.bg, color: urgency.color, fontWeight: 900, borderRadius: 0, width: 140 }} 
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button 
                        size="small" 
                        variant="contained" 
                        onClick={() => navigate(`/detenus/juridique/${doc.detenu}`)}
                        sx={{ bgcolor: RDC_BLUE, fontWeight: 900, borderRadius: 0 }}
                      >
                        RÉGULARISER
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box mt={3} display="flex" alignItems="center" gap={1}>
        <HistoryOutlined fontSize="small" color="disabled" />
        <Typography variant="caption" color="textSecondary">Mise à jour automatique : {new Date().toLocaleTimeString()}</Typography>
      </Box>
    </Box>
  );
};

export default AlertesEcheances;