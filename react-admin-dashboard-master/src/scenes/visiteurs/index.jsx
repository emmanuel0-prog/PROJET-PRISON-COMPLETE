import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Box, Typography, alpha, Button, Grid, Avatar, Chip, Stack, Paper, 
  IconButton, TextField, InputAdornment, Dialog, DialogTitle, 
  DialogContent, DialogActions, Alert, AlertTitle, Checkbox, 
  FormControlLabel, CircularProgress, useTheme, Tooltip, LinearProgress
} from "@mui/material";
import { DataGrid, frFR } from "@mui/x-data-grid";
import {
  SearchOutlined, RefreshOutlined, VisibilityOutlined, CloseOutlined, 
  BadgeOutlined, WarningAmberOutlined, MeetingRoomOutlined as ParloirIcon, 
  QrCodeScannerOutlined, CheckCircleOutlined
} from "@mui/icons-material";
import { Html5QrcodeScanner } from "html5-qrcode";

// --- IMPORT DES IMAGES ---
import sceauRdc from "../../assets/gouvernement rdc.png";
import drapeauRdc from "../../assets/rdc.png";

import api from "../../api"; // ✅ API CENTRALISÉE

// --- COMPOSANT STATCARD HIGH-TECH ---
const StatCard = ({ title, value, sub, icon, color, isDark, rdcColors }) => (
  <Paper sx={{ 
    p: 3, 
    borderRadius: "20px", 
    bgcolor: rdcColors.card, 
    backdropFilter: "blur(12px)",
    border: `1px solid ${alpha(color, isDark ? 0.3 : 0.1)}`,
    boxShadow: `0 8px 32px 0 ${alpha(color, isDark ? 0.15 : 0.05)}`,
    display: "flex", alignItems: "center", justifyContent: "space-between", 
    position: "relative", overflow: "hidden",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    "&:hover": { 
      transform: "translateY(-5px)", 
      boxShadow: `0 12px 40px 0 ${alpha(color, isDark ? 0.3 : 0.15)}`,
      border: `1px solid ${alpha(color, 0.5)}`,
    }
  }}>
    {/* Effet lumineux en arrière-plan */}
    <Box sx={{ position: "absolute", top: "-20px", right: "-20px", width: "100px", height: "100px", background: `radial-gradient(circle, ${alpha(color, 0.2)} 0%, transparent 70%)`, zIndex: 0 }} />
    
    <Box sx={{ position: "absolute", top: 0, right: 0, p: 2, opacity: isDark ? 0.05 : 0.03, transform: "scale(2.5) translate(20%, -20%)" }}>{icon}</Box>
    
    <Box position="relative" zIndex={1}>
      <Typography variant="caption" sx={{ fontWeight: 800, color: rdcColors.muted, textTransform: "uppercase", letterSpacing: 1.5 }}>{title}</Typography>
      <Typography variant="h3" sx={{ fontWeight: 900, color: rdcColors.textMain, my: 1, fontFamily: "'Inter', sans-serif" }}>{value}</Typography>
      <Typography variant="caption" sx={{ fontWeight: 700, color: color, display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: color, display: 'inline-block', boxShadow: `0 0 8px ${color}` }} />
        {sub}
      </Typography>
    </Box>
    <Avatar sx={{ bgcolor: alpha(color, isDark ? 0.15 : 0.1), color: color, width: 64, height: 64, borderRadius: "16px", border: `1px solid ${alpha(color, 0.3)}` }}>{icon}</Avatar>
  </Paper>
);

const GestionVisiteurs = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // --- PALETTE ADAPTATIVE HIGH-TECH ---
  const RDC_COLORS = {
    blue: "#007FFF", 
    red: "#CE1021", 
    yellow: "#F7D618", 
    green: "#10B981",
    // Couleurs adaptables
    textMain: isDark ? "#FFFFFF" : "#0F172A",
    surface: isDark ? "#070B14" : "#F8FAFC",
    card: isDark ? "rgba(15, 23, 42, 0.6)" : "rgba(255, 255, 255, 0.8)",
    muted: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "rgba(0, 127, 255, 0.2)" : "rgba(15, 23, 42, 0.1)",
    gridBg: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)"
  };

  const [visites, setVisites] = useState([]);
  const [stats, setStats] = useState({ totalVisiteursJour: 0, visitesEnCours: 0, alertesWatchlist: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // États Modals
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [openDetail, setOpenDetail] = useState(false);
  
  // États Clôture (Checkout)
  const [checkoutVisitor, setCheckoutVisitor] = useState(null);
  const [openCheckout, setOpenCheckout] = useState(false);
  const [itemsConfirmed, setItemsConfirmed] = useState(false);
  const [scanValue, setScanValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Chrono en direct
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000); 
    return () => clearInterval(timer);
  }, []);

  // --- FETCH INITIAL ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/intelligence/dashboard/");
      const rawData = response.data.intelligenceData || [];
      const formatted = rawData.map(v => ({
        ...v,
        id: v.id,
        nom: v.nom || "Inconnu",
        detenu: v.detenu || "N/A",
        statut: v.statut || "EN ATTENTE",
        heure_entree: v.heure_entree_iso || new Date().toISOString() 
      }));
      setVisites(formatted);
      setStats(response.data.stats || { totalVisiteursJour: 0, visitesEnCours: 0, alertesWatchlist: 0 });
    } catch (error) {
      console.error("Erreur API:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- LOGIQUE DU SCANNER ---
  useEffect(() => {
    let scanner = null;

    if (openCheckout && !scanValue) {
      const timer = setTimeout(() => {
        const scannerElement = document.getElementById("reader");
        if (scannerElement) {
          scanner = new Html5QrcodeScanner("reader", { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0 
          });

          scanner.render((decodedText) => {
            setScanValue(decodedText);
            scanner.clear().catch(e => console.warn("Erreur stop scanner:", e));
          }, (err) => { /* ignore */ });
        }
      }, 400);

      return () => {
        clearTimeout(timer);
        if (scanner) scanner.clear().catch(e => console.warn("Cleanup scanner:", e));
      };
    }
  }, [openCheckout, scanValue]);

  const handleOpenCheckout = (visiteur) => {
    setCheckoutVisitor(visiteur);
    setItemsConfirmed(false);
    setScanValue(""); 
    setOpenCheckout(true);
  };

  const handleConfirmCheckout = async (withPrint = false) => {
    if (!checkoutVisitor) return;
    setIsProcessing(true);

    try {
      await api.patch(`/visiteurs/${checkoutVisitor.id}/cloturer/`);
      
      if (withPrint) {
        window.print();
      }

      setOpenCheckout(false);
      setOpenDetail(false);
      fetchData(); 
    } catch (error) {
      console.error("Erreur clôture:", error);
      alert("Erreur lors de la mise à jour du statut.");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredVisites = useMemo(() => {
    return visites.filter((v) => 
      v.nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
      v.detenu.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [visites, searchTerm]);

  const columns = [
    { field: "nom", headerName: "VISITEUR", flex: 1.2, renderCell: (p) => (
      <Box display="flex" alignItems="center" gap={1.5}>
        <Avatar src={p.row.photo_url} sx={{ width: 38, height: 38, bgcolor: alpha(RDC_COLORS.blue, 0.1), color: RDC_COLORS.blue, fontWeight: 800, border: `1px solid ${alpha(RDC_COLORS.blue, 0.5)}` }}>
          {p.value ? p.value[0] : "?"}
        </Avatar>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 800, color: RDC_COLORS.textMain }}>{p.value}</Typography>
          <Typography variant="caption" sx={{ color: RDC_COLORS.muted, fontWeight: 600 }}>{p.row.type}</Typography>
        </Box>
      </Box>
    )},
    { field: "detenu", headerName: "DÉTENU VISITÉ", flex: 1, renderCell: (p) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: RDC_COLORS.blue, fontFamily: "'Courier New', Courier, monospace" }}>{p.value}</Typography>
    )},
    { field: "chrono", headerName: "DURÉE DE VISITE", width: 220, renderCell: (p) => {
      if (p.row.statut !== "EN PARLOIR") return <Typography variant="caption" color="text.disabled">---</Typography>;
      
      const isAvocat = p.row.type === "Avocat (Confidentiel)";
      const debut = new Date(p.row.heure_entree);
      const diffMinutes = Math.floor((now - debut) / 60000);
      
      let isDanger = !isAvocat && diffMinutes >= 45;
      let color = isDanger ? RDC_COLORS.red : (diffMinutes >= 35 ? RDC_COLORS.yellow : RDC_COLORS.blue);
      if (isAvocat) color = RDC_COLORS.green;

      return (
        <Box sx={{ width: '100%', mt: 1 }}>
          <Stack direction="row" justifyContent="space-between" mb={0.5}>
            <Typography variant="caption" sx={{ fontWeight: 900, color: color, textShadow: isDark ? `0 0 5px ${alpha(color, 0.5)}` : 'none' }}>
              {diffMinutes} min / {isAvocat ? "∞" : "45"}
            </Typography>
            {isDanger && <WarningAmberOutlined sx={{ fontSize: 16, color: RDC_COLORS.red, filter: isDark ? `drop-shadow(0 0 5px ${RDC_COLORS.red})` : 'none' }} />}
          </Stack>
          <LinearProgress variant={isAvocat ? "indeterminate" : "determinate"} value={Math.min((diffMinutes/45)*100, 100)} 
            sx={{ 
              height: 6, borderRadius: 4, bgcolor: alpha(color, 0.1), 
              "& .MuiLinearProgress-bar": { bgcolor: color, animation: isDanger ? "pulse 1s infinite" : "none", boxShadow: isDark ? `0 0 10px ${color}` : 'none' } 
            }} 
          />
        </Box>
      );
    }},
    { field: "statut", headerName: "STATUT", width: 140, renderCell: ({ value }) => {
      let color = value === "EN PARLOIR" ? RDC_COLORS.blue : (value === "TERMINE" ? RDC_COLORS.green : (value === "REFUSE" ? RDC_COLORS.red : RDC_COLORS.yellow));
      return <Chip label={value} size="small" sx={{ fontWeight: 800, borderRadius: "6px", bgcolor: alpha(color, 0.1), color: color, border: `1px solid ${alpha(color, 0.4)}`, boxShadow: isDark ? `0 0 10px ${alpha(color, 0.2)}` : 'none' }} />;
    }},
    { field: "actions", headerName: "OPÉRATIONS", width: 150, sortable: false, renderCell: (p) => (
      <Stack direction="row" spacing={1} alignItems="center">
        <Tooltip title="Voir le profil">
          <IconButton size="small" onClick={() => { setSelectedVisitor(p.row); setOpenDetail(true); }} sx={{ color: RDC_COLORS.blue, bgcolor: alpha(RDC_COLORS.blue, 0.1), '&:hover': { bgcolor: alpha(RDC_COLORS.blue, 0.2) } }}>
            <VisibilityOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
        {p.row.statut === "EN PARLOIR" && (
          <Button variant="contained" size="small" onClick={() => handleOpenCheckout(p.row)} startIcon={<QrCodeScannerOutlined />} 
            sx={{ bgcolor: RDC_COLORS.red, borderRadius: "6px", px: 2, fontSize: "0.7rem", fontWeight: 800, boxShadow: `0 4px 14px 0 ${alpha(RDC_COLORS.red, 0.39)}`, '&:hover': { bgcolor: alpha(RDC_COLORS.red, 0.8) } }}>
            CLÔTURER
          </Button>
        )}
      </Stack>
    )}
  ];

  return (
    <Box sx={{ 
      p: 4, 
      bgcolor: RDC_COLORS.surface, 
      minHeight: "100vh",
      // Background Grid Effect High-Tech
      backgroundImage: `linear-gradient(${RDC_COLORS.gridBg} 1px, transparent 1px), linear-gradient(90deg, ${RDC_COLORS.gridBg} 1px, transparent 1px)`,
      backgroundSize: '30px 30px'
    }}>
      <style>{`
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
        @media print { .no-print { display: none !important; } .print-only { display: block !important; } }
      `}</style>

      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={5} className="no-print">
        <Stack direction="row" alignItems="center" spacing={3}>
          <Box sx={{ position: 'relative' }}>
            <Box component="img" src={sceauRdc} sx={{ height: 75, position: 'relative', zIndex: 1 }} />
            {isDark && <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 60, height: 60, bgcolor: RDC_COLORS.blue, filter: 'blur(30px)', zIndex: 0 }} />}
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, color: RDC_COLORS.textMain, letterSpacing: "-1px" }}>Registre des Visites</Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: RDC_COLORS.muted, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box component="img" src={drapeauRdc} sx={{ height: 14, borderRadius: '2px' }} /> POSTE DE GARDE • CONTRÔLE TERRAIN
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
            <Paper elevation={0} sx={{ display: 'flex', alignItems: 'center', p: 0.5, borderRadius: "12px", bgcolor: RDC_COLORS.card, border: `1px solid ${RDC_COLORS.border}`, backdropFilter: "blur(10px)" }}>
              <InputAdornment position="start" sx={{ pl: 2 }}><SearchOutlined sx={{ color: RDC_COLORS.blue }} /></InputAdornment>
              <TextField variant="standard" placeholder="Matricule ou Nom..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} InputProps={{ disableUnderline: true, sx: { fontSize: '0.9rem', fontWeight: 600, width: 220, color: RDC_COLORS.textMain } }} />
            </Paper>
            <IconButton onClick={fetchData} sx={{ bgcolor: alpha(RDC_COLORS.blue, 0.1), color: RDC_COLORS.blue, borderRadius: "12px", border: `1px solid ${alpha(RDC_COLORS.blue, 0.2)}` }}>
              <RefreshOutlined />
            </IconButton>
        </Stack>
      </Box>

      {/* STATS */}
      <Grid container spacing={3} mb={5} className="no-print">
        <Grid item xs={12} md={4}><StatCard title="Total Aujourd'hui" value={stats.totalVisiteursJour} sub="Visiteurs enregistrés" icon={<BadgeOutlined fontSize="large" />} color={RDC_COLORS.blue} isDark={isDark} rdcColors={RDC_COLORS} /></Grid>
        <Grid item xs={12} md={4}><StatCard title="En Parloir" value={stats.visitesEnCours} sub="Sessions actives" icon={<ParloirIcon fontSize="large" />} color={RDC_COLORS.yellow} isDark={isDark} rdcColors={RDC_COLORS} /></Grid>
        <Grid item xs={12} md={4}><StatCard title="Sécurité" value={stats.alertesWatchlist} sub="Alertes & Watchlist" icon={<WarningAmberOutlined fontSize="large" />} color={RDC_COLORS.red} isDark={isDark} rdcColors={RDC_COLORS} /></Grid>
      </Grid>

      {/* TABLEAU */}
      <Paper sx={{ 
        borderRadius: "24px", 
        bgcolor: RDC_COLORS.card, 
        backdropFilter: "blur(16px)",
        border: `1px solid ${RDC_COLORS.border}`,
        boxShadow: `0 10px 40px ${alpha("#000", isDark ? 0.3 : 0.03)}`, 
        overflow: "hidden" 
      }} className="no-print">
        <Box sx={{ height: 600, p: 1 }}>
            <DataGrid 
              rows={filteredVisites} 
              columns={columns} 
              loading={loading} 
              localeText={frFR.components.MuiDataGrid.defaultProps.localeText} 
              rowHeight={75} 
              disableSelectionOnClick 
              sx={{ 
                border: "none", 
                color: RDC_COLORS.textMain,
                "& .MuiDataGrid-columnHeaders": { bgcolor: alpha(RDC_COLORS.blue, 0.03), borderBottom: `1px solid ${RDC_COLORS.border}` },
                "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 800, color: RDC_COLORS.muted, fontSize: "0.75rem", letterSpacing: 1 },
                "& .MuiDataGrid-cell": { borderBottom: `1px solid ${RDC_COLORS.border}` },
                "& .MuiDataGrid-row:hover": { bgcolor: alpha(RDC_COLORS.blue, 0.02) },
                "& .MuiDataGrid-footerContainer": { borderTop: `1px solid ${RDC_COLORS.border}` }
              }} 
            />
        </Box>
      </Paper>

      {/* MODAL 1 : DÉTAILS */}
      <Dialog open={openDetail} onClose={() => setOpenDetail(false)} fullWidth maxWidth="md" 
        PaperProps={{ sx: { borderRadius: "24px", bgcolor: isDark ? '#0B1120' : '#FFFFFF', backgroundImage: 'none', border: `1px solid ${RDC_COLORS.border}` } }}>
        {selectedVisitor && (
          <>
            <DialogTitle sx={{ 
              bgcolor: alpha(RDC_COLORS.blue, isDark ? 0.1 : 0.9), 
              color: isDark ? RDC_COLORS.blue : "#fff", 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderBottom: `1px solid ${RDC_COLORS.border}`
            }}>
              <Box display="flex" alignItems="center" gap={1}>
                <QrCodeScannerOutlined />
                <Typography variant="h6" fontWeight={900} letterSpacing={1}>FICHE D'IDENTIFICATION</Typography>
              </Box>
              <IconButton onClick={() => setOpenDetail(false)} sx={{ color: isDark ? RDC_COLORS.muted : "#fff" }}><CloseOutlined /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 4, bgcolor: 'transparent', borderColor: RDC_COLORS.border }}>
              <Grid container spacing={4}>
                  <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                    <Box sx={{ position: 'relative', display: 'inline-block' }}>
                      <Avatar src={selectedVisitor.photo_url} sx={{ width: 140, height: 140, border: `3px solid ${RDC_COLORS.blue}`, boxShadow: isDark ? `0 0 20px ${alpha(RDC_COLORS.blue, 0.5)}` : 'none' }} />
                      <Box sx={{ position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)' }}>
                        <Chip label={selectedVisitor.statut} size="small" sx={{ fontWeight: 800, bgcolor: RDC_COLORS.blue, color: '#fff' }} />
                      </Box>
                    </Box>
                    <Typography variant="h5" fontWeight={900} color={RDC_COLORS.textMain} mt={3}>{selectedVisitor.nom}</Typography>
                    <Chip variant="outlined" label={selectedVisitor.type} sx={{ mt: 1, fontWeight: 800, color: RDC_COLORS.muted, borderColor: RDC_COLORS.border }} />
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2, borderRadius: "12px", mb: 2, bgcolor: alpha(RDC_COLORS.blue, 0.03), border: `1px dashed ${RDC_COLORS.border}` }}>
                      <Typography variant="caption" color={RDC_COLORS.muted} fontWeight={700}>DÉTENU VISITÉ (CIBLE) :</Typography>
                      <Typography variant="h6" fontWeight={800} color={RDC_COLORS.blue} sx={{ fontFamily: "'Courier New', monospace" }}>{selectedVisitor.detenu}</Typography>
                    </Paper>
                    <Paper sx={{ p: 2, borderRadius: "12px", bgcolor: alpha(RDC_COLORS.muted, 0.05), border: `1px solid ${RDC_COLORS.border}` }}>
                      <Typography variant="caption" color={RDC_COLORS.muted} fontWeight={700}>DOCUMENT D'IDENTITÉ :</Typography>
                      <Typography variant="body1" fontWeight={800} color={RDC_COLORS.textMain} sx={{ letterSpacing: 2 }}>{selectedVisitor.id_document || "NON RENSEIGNÉ"}</Typography>
                    </Paper>
                  </Grid>
              </Grid>
            </DialogContent>
            {selectedVisitor.statut === "EN PARLOIR" && (
              <DialogActions sx={{ p: 3, borderTop: `1px solid ${RDC_COLORS.border}` }}>
                <Button variant="contained" fullWidth onClick={() => handleOpenCheckout(selectedVisitor)} 
                  sx={{ 
                    bgcolor: alpha(RDC_COLORS.red, isDark ? 0.2 : 1), 
                    color: isDark ? RDC_COLORS.red : '#fff',
                    border: isDark ? `1px solid ${RDC_COLORS.red}` : 'none',
                    py: 1.5, fontWeight: 900, letterSpacing: 1,
                    '&:hover': { bgcolor: RDC_COLORS.red, color: '#fff', boxShadow: `0 0 15px ${RDC_COLORS.red}` }
                  }}>
                  INITIALISER CLÔTURE DE VISITE
                </Button>
              </DialogActions>
            )}
          </>
        )}
      </Dialog>

      {/* MODAL 2 : SCANNER & CLÔTURE */}
      <Dialog open={openCheckout} onClose={() => !isProcessing && setOpenCheckout(false)} fullWidth maxWidth="sm" 
        PaperProps={{ sx: { borderRadius: "24px", bgcolor: isDark ? '#0B1120' : '#FFFFFF', border: `1px solid ${RDC_COLORS.border}` } }}>
        {checkoutVisitor && (() => {
          const isTokenValid = scanValue.trim() === (checkoutVisitor.token || checkoutVisitor.id_document);
          const canClose = isTokenValid && (checkoutVisitor.effets_consignes ? itemsConfirmed : true);

          return (
          <>
            <DialogTitle sx={{ fontWeight: 900, textAlign: 'center', pt: 4, color: RDC_COLORS.textMain, letterSpacing: 2 }}>CONTRÔLE DE SORTIE BIOMÉTRIQUE</DialogTitle>
            <DialogContent sx={{ px: 4 }}>
              <Box sx={{ 
                mb: 4, textAlign: 'center', p: 3, 
                border: `2px dashed ${isTokenValid ? RDC_COLORS.green : RDC_COLORS.blue}`, 
                borderRadius: '16px', 
                bgcolor: alpha(isTokenValid ? RDC_COLORS.green : RDC_COLORS.blue, 0.05),
                transition: 'all 0.3s ease'
              }}>
                {isTokenValid ? (
                  <Box py={2}>
                    <CheckCircleOutlined sx={{ fontSize: 60, color: RDC_COLORS.green, filter: isDark ? `drop-shadow(0 0 10px ${RDC_COLORS.green})` : 'none' }} />
                    <Typography variant="h6" fontWeight={900} color={RDC_COLORS.green} letterSpacing={1}>IDENTITÉ CONFIRMÉE</Typography>
                    <Typography variant="caption" color={RDC_COLORS.green} sx={{ fontFamily: 'monospace' }}>TOKEN MATCHER: SUCCESS</Typography>
                  </Box>
                ) : (
                  <>
                    <div id="reader" style={{ width: '100%', marginBottom: '15px', borderRadius: '8px', overflow: 'hidden' }}></div>
                    {!scanValue && <Typography variant="caption" display="block" mb={2} color={RDC_COLORS.muted}>EN ATTENTE DU SCAN QR CODE OU ID...</Typography>}
                    <TextField fullWidth placeholder="Saisie manuelle du Token/ID..." value={scanValue} onChange={(e) => setScanValue(e.target.value)} size="small" 
                      InputProps={{ sx: { bgcolor: alpha(RDC_COLORS.muted, 0.1), color: RDC_COLORS.textMain, fontFamily: 'monospace' } }} />
                  </>
                )}
              </Box>

              {checkoutVisitor.effets_consignes && (
                <Alert severity="warning" sx={{ borderRadius: "12px", bgcolor: alpha(RDC_COLORS.yellow, 0.1), color: RDC_COLORS.yellow, border: `1px solid ${alpha(RDC_COLORS.yellow, 0.3)}` }}>
                  <AlertTitle sx={{ fontWeight: 900, letterSpacing: 1 }}>OBJETS CONSIGNÉS DÉTECTÉS</AlertTitle>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{checkoutVisitor.effets_consignes}</Typography>
                  <Box mt={1}>
                    <FormControlLabel 
                      control={<Checkbox checked={itemsConfirmed} onChange={(e) => setItemsConfirmed(e.target.checked)} sx={{ color: RDC_COLORS.yellow, '&.Mui-checked': { color: RDC_COLORS.yellow } }} />} 
                      label={<Typography variant="caption" fontWeight={700}>Confirmation de restitution au visiteur effectuée</Typography>} 
                    />
                  </Box>
                </Alert>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 4, flexDirection: 'column', gap: 2 }}>
              <Button variant="contained" fullWidth disabled={!canClose || isProcessing} onClick={() => handleConfirmCheckout(true)} 
                sx={{ 
                  bgcolor: isTokenValid ? RDC_COLORS.green : alpha(RDC_COLORS.muted, 0.5), 
                  py: 2, borderRadius: "12px", fontWeight: 900, letterSpacing: 1,
                  boxShadow: isTokenValid && isDark ? `0 0 20px ${alpha(RDC_COLORS.green, 0.4)}` : 'none',
                  '&:hover': { bgcolor: RDC_COLORS.green }
                }}>
                {isProcessing ? <CircularProgress size={24} color="inherit" /> : "CLÔTURER ET IMPRIMER LE REÇU DE SORTIE"}
              </Button>
              <Button onClick={() => setOpenCheckout(false)} sx={{ color: RDC_COLORS.muted, fontWeight: 700 }}>ANNULER LA PROCÉDURE</Button>
            </DialogActions>
          </>
          );
        })()}
      </Dialog>
    </Box>
  );
};

export default GestionVisiteurs;