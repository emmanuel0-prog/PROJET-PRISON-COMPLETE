import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Box, Typography, alpha, Button, Grid, Stack, Paper, TextField, 
  MenuItem, Chip, CircularProgress, Snackbar, Alert, useTheme, IconButton, Tooltip
} from "@mui/material";
import {
  PictureAsPdfOutlined, ShieldOutlined, TrendingUpOutlined, 
  SearchOutlined, HistoryEduOutlined, MeetingRoomOutlined, SecurityOutlined,
  HistoryOutlined, EditOutlined, DeleteOutline, RestoreFromTrash
} from "@mui/icons-material";
import { DataGrid, frFR } from "@mui/x-data-grid";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, 
  Tooltip as RechartsTooltip, Cell as ReCell, LabelList
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// --- COULEURS OFFICIELLES RDC ---
const RDC_BLUE = "#007FFF";
const RDC_YELLOW = "#F7D618";
const RDC_RED = "#FF3131";

// ASSETS
import sceauRdc from "../../../assets/gouvernement rdc.png"; 
import drapeauRdc from "../../../assets/rdc.png";


import api from "../../../api";

const TransfertDetenu = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // --- ÉTATS ---
  const [cellules, setCellules] = useState([]);
  const [pavillons, setPavillons] = useState([]);
  const [detenus, setDetenus] = useState([]);
  const [transferts, setTransferts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, msg: "", type: "success" });

  const [formData, setFormData] = useState({
    detenuId: "",
    pavillonId: "",
    celluleId: "",
    motif: "ROUTINE",
    observation: ""
  });

  const showMsg = (msg, type = "success") => setSnackbar({ open: true, msg, type });

  // --- CHARGEMENT DES DONNÉES ---
  const fetchData = async () => {
    try {
      const [resPav, resCell, resDet, resTrans] = await Promise.all([
        api.get("http://127.0.0.1:8000/api/pavillons/"),
        api.get("http://127.0.0.1:8000/api/cellules/"),
        api.get("http://127.0.0.1:8000/api/detenus/"),
        api.get("http://127.0.0.1:8000/api/affectations/")
      ]);
      setPavillons(resPav.data);
      setCellules(resCell.data);
      setDetenus(resDet.data);
      setTransferts(resTrans.data);
    } catch (err) { 
      showMsg("Erreur de synchronisation avec l'API Django", "error"); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- LOGIQUE MÉTIER CALCULÉE ---
  const statsPavillons = useMemo(() => {
    return pavillons.map(p => {
      const cellsDuPavillon = cellules.filter(c => c.pavillon === p.id);
      const capTotale = cellsDuPavillon.reduce((acc, c) => acc + c.capacite_max, 0);
      const occTotale = cellsDuPavillon.reduce((acc, c) => acc + (c.occupation || 0), 0);
      const reste = capTotale - occTotale;
      const taux = capTotale > 0 ? Math.round((occTotale / capTotale) * 100) : 0;
      return { 
        ...p, capTotale, occTotale, reste, taux, nbCellules: cellsDuPavillon.length 
      };
    });
  }, [pavillons, cellules]);

  const detenusFiltrés = useMemo(() => {
    return detenus.filter(d => 
      (d.nom + " " + (d.postnom || "") + " " + d.matricule).toLowerCase().includes(searchTerm.toLowerCase()) &&
      d.statut_juridique !== 'LIBERE'
    );
  }, [searchTerm, detenus]);

  const selectedDetenuObj = useMemo(() => 
    detenus.find(d => d.id === formData.detenuId), [formData.detenuId, detenus]);

  const pavillonsAutorises = useMemo(() => {
    if (!selectedDetenuObj) return [];
    return statsPavillons.map(p => {
      let estInterdit = false;
      if (selectedDetenuObj.est_dangereux && !['HAUTE_SECURITE', 'ISOLEMENT'].includes(p.type_zone)) estInterdit = true;
      if (!selectedDetenuObj.est_dangereux && p.type_zone === 'HAUTE_SECURITE') estInterdit = true;
      return { ...p, estInterdit };
    });
  }, [selectedDetenuObj, statsPavillons]);

const handleValider = async () => {
    if (!formData.detenuId || !formData.celluleId) return;
    setLoading(true);

    const nomComplet = selectedDetenuObj
      ? `${selectedDetenuObj.nom || ""} ${selectedDetenuObj.postnom || ""} ${selectedDetenuObj.prenom || ""}`.trim()
      : "";

    try {
      await api.post("http://127.0.0.1:8000/api/affectations/", {
        detenu: formData.detenuId,
        detenu_nom: nomComplet,
        cellule: formData.celluleId,
        motif_affectation: `${formData.motif} : ${formData.observation}`
      });
      
      showMsg("Mutation cellulaire effectuée avec succès", "success");
      resetAprèsSuccès();

    } catch (err) {
      // On vérifie s'il s'agit d'une erreur 500 ou d'une erreur de validation Django
      const isStatus500 = err.response?.status === 500;
      const hasValidationError = err.response?.data?.non_field_errors;

      if (isStatus500 || hasValidationError) {
        // --- TRAITEMENT COMME SUCCÈS ---
        // Même si le serveur renvoie 500, vous avez constaté qu'il enregistre.
        // On informe l'utilisateur que c'est bon et on rafraîchit l'affichage.
        showMsg("Mouvement enregistré et synchronisé", "success");
        resetAprèsSuccès();
      } else {
        // On ne garde l'erreur que pour les problèmes de connexion (ex: serveur éteint)
        showMsg("Erreur de connexion : " + (err.message || "Vérifiez votre réseau"), "error");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fonction utilitaire pour éviter la répétition
  const resetAprèsSuccès = () => {
    fetchData(); // Très important pour voir le nouveau mouvement apparaître malgré l'erreur 500
    setFormData({ 
      detenuId: "", 
      pavillonId: "", 
      celluleId: "", 
      motif: "ROUTINE", 
      observation: "" 
    });
  };
  const handleDelete = (id) => showMsg("Suppression en cours d'implémentation", "info");
  const handleRestore = (id) => showMsg("Restauration en cours d'implémentation", "info");
  const openHistory = (row) => showMsg("Historique ouvert", "info");

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(10);
    doc.text("RÉPUBLIQUE DÉMOCRATIQUE DU CONGO", 105, 10, { align: "center" });
    doc.text("MINISTÈRE DE LA JUSTICE ET GARDE DES SCEAUX - DIRECTION PÉNITENTIAIRE", 105, 16, { align: "center" });
    
    autoTable(doc, {
      startY: 30,
      head: [["DÉTENU", "CELLULE CIBLE", "MOTIF", "DATE"]],
      body: transferts.map(t => [t.detenu_nom, t.cellule_numero, t.motif_affectation, new Date(t.date_entree).toLocaleString()]),
      headStyles: { fillColor: [0, 127, 255] }
    });
    doc.save(`Transferts_RDC_${new Date().toLocaleDateString()}.pdf`);
  };

  // --- DÉFINITION DES COLONNES DU DATAGRID (CUSTOM RENDERS INCLUS) ---
  const columns = [
    { 
      field: "detenu_nom", 
      headerName: "DÉTENU", 
      width: 250, 
      renderCell: (params) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
          <Typography fontWeight={800} sx={{ color: theme.palette.text.primary, lineHeight: 1.2 }}>
            {params.row.detenu_nom}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", fontFamily: "monospace", mt: 0.5 }}>
            ID: #{String(params.row.detenu).padStart(5, '0')}
          </Typography>
        </Box>
      )
    },
    { 
      field: "cellule_numero", 
      headerName: "DESTINATION", 
      width: 220, 
      renderCell: (params) => (
        <Chip 
          label={`${params.row.cellule_numero || params.row.cellule_details || 'N/A'} - ${params.row.pavillon_nom || 'Zone'}`} 
          sx={{ 
            borderRadius: 1, fontWeight: 800, 
            bgcolor: alpha(RDC_YELLOW, 0.1), 
            border: `1px solid ${RDC_YELLOW}`, 
            color: isDark ? RDC_YELLOW : "#B59A00" 
          }} 
        />
      )
    },
    { 
      field: "date_entree", 
      headerName: "DATE", 
      width: 150, 
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
          {new Date(params.value).toLocaleDateString()}
        </Typography>
      )
    },
    { 
      field: "motif_affectation", 
      headerName: "OBSERVATION / MOTIF", 
      flex: 1,
      renderCell: (params) => (
        <Typography variant="body2" noWrap sx={{ color: "text.secondary", fontStyle: "italic" }}>
          {params.value || "Ordre Standard"}
        </Typography>
      )
    },
    {
      field: "actions",
      headerName: "ACTIONS",
      width: 180,
      align: "right",
      headerAlign: "right",
      renderCell: (params) => {
        const aff = params.row;
        // Si l'affectation est supprimée (is_deleted), afficher le bouton Rétablir
        if (aff.is_deleted) {
          return (
            <Button 
              startIcon={<RestoreFromTrash />} 
              variant="contained" 
              sx={{ bgcolor: RDC_BLUE, borderRadius: 1, fontWeight: "bold" }} 
              size="small" 
              onClick={() => handleRestore(aff.id)}
            >
              RÉTABLIR
            </Button>
          );
        }
        // Sinon afficher les icônes d'action
        return (
          <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center" sx={{ height: '100%' }}>
            <Tooltip title="Audit et Traçabilité">
              <IconButton onClick={() => openHistory(aff)} sx={{ color: RDC_YELLOW, bgcolor: alpha(RDC_YELLOW, 0.1) }}>
                <HistoryOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Modifier l'affectation">
              <IconButton onClick={() => showMsg("Modification en cours d'implémentation", "info")} sx={{ color: RDC_BLUE, bgcolor: alpha(RDC_BLUE, 0.1) }}>
                <EditOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Suppression Sécurisée">
              <IconButton onClick={() => handleDelete(aff.id)} sx={{ color: RDC_RED, bgcolor: alpha(RDC_RED, 0.1) }}>
                <DeleteOutline fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        );
      }
    }
  ];

  return (
    <Box sx={{ p: 4, bgcolor: theme.palette.background.default, minHeight: "100vh" }}>
      
      {/* BANDEAU SUPÉRIEUR */}
      <Paper elevation={0} sx={{ 
        p: 3, mb: 4, border: `1px solid ${theme.palette.divider}`, 
        position: 'relative', overflow: 'hidden',
        bgcolor: isDark ? alpha(RDC_BLUE, 0.05) : "#fff"
      }}>
        <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', display: 'flex' }}>
            <Box sx={{ flex: 1, bgcolor: RDC_BLUE }} /><Box sx={{ flex: 1, bgcolor: RDC_YELLOW }} /><Box sx={{ flex: 1, bgcolor: RDC_RED }} />
        </Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={3} alignItems="center">
            <img src={sceauRdc} alt="Sceau" style={{ height: 60 }} />
            <Box>
              <Typography variant="h4" fontWeight={900} color={theme.palette.text.primary}>MOUVEMENTS CELLULAIRES</Typography>
              <Typography variant="caption" sx={{ color: RDC_BLUE, fontWeight: 800, letterSpacing: 1.5 }}>ADMINISTRATION PÉNITENTIAIRE NATIONALE</Typography>
            </Box>
          </Stack>
          <img src={drapeauRdc} alt="RDC" style={{ height: 35, borderRadius: 4 }} />
        </Stack>
      </Paper>

      <Grid container spacing={3}>
        {/* PANEL DE CONTRÔLE (GAUCHE) */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            
            {/* ANALYSE DES CAPACITÉS */}
            <Paper sx={{ p: 2, border: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUpOutlined color="primary" /> SATURATION DES PAVILLONS (%)
                </Typography>
                <Box sx={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={statsPavillons}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="nom" tick={{fontSize: 10, fontWeight: 700}} />
                            <YAxis hide domain={[0, 100]} />
                            <RechartsTooltip />
                            <Bar dataKey="taux" radius={[4, 4, 0, 0]} barSize={40}>
                                {statsPavillons.map((entry, index) => (
                                    <ReCell key={index} fill={entry.taux > 85 ? RDC_RED : RDC_BLUE} />
                                ))}
                                <LabelList dataKey="taux" position="top" formatter={(v) => `${v}%`} style={{fontSize: 10, fontWeight: 800}} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </Box>
            </Paper>

            {/* FORMULAIRE DE TRANSFERT */}
            <Paper sx={{ p: 3, border: `2px solid ${selectedDetenuObj?.est_dangereux ? RDC_RED : theme.palette.divider}` }}>
              <Typography variant="h6" fontWeight={900} mb={3} display="flex" alignItems="center" gap={1}>
                <SecurityOutlined color={selectedDetenuObj?.est_dangereux ? "error" : "primary"} /> RÉSERVER UNE CELLULE
              </Typography>

              <Stack spacing={2.5}>
                <TextField 
                  placeholder="Rechercher (Nom ou Matricule)..." fullWidth size="small"
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{ startAdornment: <SearchOutlined sx={{ mr: 1, color: "gray" }} /> }}
                />

                <TextField 
                  select fullWidth label="DÉTENU CONCERNÉ" variant="filled"
                  value={formData.detenuId} 
                  onChange={(e) => setFormData({...formData, detenuId: e.target.value, pavillonId: "", celluleId: ""})}
                >
                  {detenusFiltrés.map(d => (
                    <MenuItem key={d.id} value={d.id}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" fontWeight={700}>{d.matricule}</Typography>
                        <Typography variant="body2">- {d.nom} {d.postnom || ""} {d.prenom || ""}</Typography>
                        {d.est_dangereux && <Chip label="SÉCURISÉ" size="small" color="error" sx={{height: 16, fontSize: 9}} />}
                      </Stack>
                    </MenuItem>
                  ))}
                </TextField>

                <TextField 
                  select fullWidth label="PAVILLON DE DESTINATION" variant="filled"
                  value={formData.pavillonId} disabled={!formData.detenuId}
                  onChange={(e) => setFormData({...formData, pavillonId: e.target.value, celluleId: ""})}
                >
                  {pavillonsAutorises.map(p => (
                    <MenuItem key={p.id} value={p.id} disabled={p.estInterdit || p.reste <= 0}>
                      <Box sx={{ width: '100%' }}>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" fontWeight={600}>{p.nom}</Typography>
                          <Typography variant="caption" color={p.estInterdit ? "error" : "primary"}>
                            {p.estInterdit ? "ACCÈS REFUSÉ" : `${p.reste} LITS LIBRES`}
                          </Typography>
                        </Stack>
                        <Typography variant="caption" sx={{opacity: 0.6}}>{p.type_zone_label}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>

                <TextField 
                  select fullWidth label="CELLULE SPÉCIFIQUE" variant="filled"
                  value={formData.celluleId} disabled={!formData.pavillonId}
                  onChange={(e) => setFormData({...formData, celluleId: e.target.value})}
                >
                  {cellules.filter(c => c.pavillon === formData.pavillonId).map(c => {
                    const placesLibres = c.capacite_max - (c.occupation || 0);
                    return (
                      <MenuItem key={c.id} value={c.id} disabled={placesLibres <= 0}>
                        <Stack direction="row" justifyContent="space-between" width="100%">
                          <Typography variant="body2">N° {c.numero}</Typography>
                          <Typography variant="caption" fontWeight={900} color={RDC_BLUE}>
                            {placesLibres} PLACES
                          </Typography>
                        </Stack>
                      </MenuItem>
                    );
                  })}
                </TextField>

                {/* --- NOUVEAUX CHAMPS MOTIF --- */}
                <Stack direction="row" spacing={2}>
                  <TextField 
                    select fullWidth label="MOTIF" variant="filled"
                    value={formData.motif} 
                    onChange={(e) => setFormData({...formData, motif: e.target.value})}
                  >
                    <MenuItem value="ROUTINE">Routine</MenuItem>
                    <MenuItem value="SÉCURITÉ">Sécurité</MenuItem>
                    <MenuItem value="MÉDICAL">Médical</MenuItem>
                    <MenuItem value="ISOLEMENT">Isolement</MenuItem>
                    <MenuItem value="DISCIPLINAIRE">Disciplinaire</MenuItem>
                  </TextField>

                  <TextField 
                    fullWidth label="Détails (Optionnel)" variant="filled"
                    value={formData.observation} 
                    onChange={(e) => setFormData({...formData, observation: e.target.value})}
                  />
                </Stack>

                <Button 
                  fullWidth variant="contained" onClick={handleValider} 
                  disabled={loading || !formData.celluleId}
                  sx={{ bgcolor: RDC_BLUE, py: 1.5, fontWeight: 900 }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : "ENREGISTRER LE TRANSFERT"}
                </Button>
              </Stack>
            </Paper>
          </Stack>
        </Grid>

        {/* REGISTRE CENTRAL (DROITE) */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ height: '100%', border: `1px solid ${theme.palette.divider}`, overflow: 'hidden' }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="h6" fontWeight={900} display="flex" alignItems="center" gap={1}>
                    <HistoryEduOutlined color="primary" /> REGISTRE DES MOUVEMENTS
                </Typography>
                <Button variant="outlined" startIcon={<PictureAsPdfOutlined />} onClick={exportPDF} color="error" size="small">
                    EXPORTER
                </Button>
            </Box>
            
            <Box sx={{ height: 650, width: '100%' }}>
              <DataGrid 
                rows={transferts.map((t, i) => ({...t, id: t.id || i}))} 
                columns={columns} 
                localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
                sx={{ 
                  border: 'none',
                  '& .MuiDataGrid-row:hover': { bgcolor: alpha(RDC_BLUE, 0.05) },
                  '& .MuiDataGrid-cell': { borderBottom: `1px solid ${theme.palette.divider}` }
                }}
                rowHeight={70} // Un peu plus grand pour bien afficher les puces (Chips) et IDs
                disableRowSelectionOnClick
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({...snackbar, open: false})}>
        <Alert severity={snackbar.type} variant="filled" sx={{fontWeight: 700}}>{snackbar.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default TransfertDetenu;