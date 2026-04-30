import React, { useState, useEffect } from "react";
import { 
    Box, Typography, Chip, IconButton, useTheme, Paper, Grid, 
    Avatar, Tooltip, alpha, Dialog, DialogTitle, DialogContent, Divider 
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { 
    Security, WarningAmber, Public, VpnKey, 
    GppBad, GppGood, Shield, PersonOff, Radar
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

import api from "../../api";
import { tokens } from "../../theme";

// Assets officiels
import sceauRdc from "../../assets/rdc.png";
import drapeauRdc from "../../assets/gouvernement rdc.png";

const AuthAuditDashboard = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode) || {}; 
    const isDark = theme.palette.mode === "dark";
    
    // 🛡️ PALETTE HAUTE SÉCURITÉ
    const safeColors = {
        blue: colors?.blueAccent?.[500] || "#007FFF",
        blueDark: colors?.blueAccent?.[700] || "#002868",
        red: colors?.redAccent?.[500] || "#CE1126",
        orange: colors?.orangeAccent?.[500] || "#FF9800",
        green: colors?.greenAccent?.[500] || "#4CAF50",
        primaryBg: colors?.primary?.[400] || (isDark ? "#141b2d" : "#f5f7fa"),
        gridBg: colors?.primary?.[400] || (isDark ? "#1F2A40" : "#ffffff"),
        text: colors?.grey?.[100] || (isDark ? "#ffffff" : "#141414"),
        muted: colors?.grey?.[400] || "#9e9e9e"
    };

    // States
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ total: 0, critical: 0, locked: 0 });
    const [selectedThreat, setSelectedThreat] = useState(null);

    const loadSecurityLogs = async () => {
        setLoading(true);
        try {
            // Remplace par ta vraie route API si nécessaire
            const response = await api.get('/auth-audit/');
            const logs = response.data;
            setData(logs);
            
            // Calcul des menaces
            setStats({ 
                total: logs.length, 
                critical: logs.filter(d => d.risk_level === 'HIGH').length, 
                locked: logs.filter(d => d.event_type === 'ACCOUNT_LOCKED').length 
            });
        } catch (error) {
            console.error("Erreur de chargement du radar de sécurité:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadSecurityLogs(); }, []);

    // 🎨 Composant clignotant pour Alerte Intrusion
    const PulseChip = ({ label, color }) => (
        <motion.div
            animate={{ boxShadow: [`0px 0px 0px ${alpha(color, 0.4)}`, `0px 0px 15px ${color}`, `0px 0px 0px ${alpha(color, 0.4)}`] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ display: "inline-block", borderRadius: "16px" }}
        >
            <Chip 
                label={label} 
                icon={<WarningAmber fontSize="small" />}
                sx={{ 
                    bgcolor: alpha(color, 0.2), color: color, 
                    fontWeight: "900", border: `1px solid ${color}` 
                }} 
            />
        </motion.div>
    );

    const columns = [
        { field: "date_heure", headerName: "HORODATAGE", width: 160, renderCell: (p) => (
            <Typography fontWeight="bold" sx={{ color: safeColors.text, fontFamily: "monospace" }}>{p.value}</Typography>
        )},
        { field: "risk_display", headerName: "NIVEAU DE RISQUE", width: 170, renderCell: (p) => {
            if (p.row.risk_level === 'HIGH') return <PulseChip label="CRITIQUE" color={safeColors.red} />;
            if (p.row.risk_level === 'MEDIUM') return <Chip label="SUSPECT" sx={{ bgcolor: alpha(safeColors.orange, 0.2), color: safeColors.orange, fontWeight: "bold" }} />;
            return <Chip label="NORMAL" sx={{ bgcolor: alpha(safeColors.green, 0.1), color: safeColors.green }} />;
        }},
        { field: "agent_name", headerName: "CIBLE / AGENT", width: 180, renderCell: (p) => (
            <Box display="flex" alignItems="center" gap={1}>
                <VpnKey sx={{ color: safeColors.blue, fontSize: "16px" }} />
                <Typography fontWeight="900" sx={{ textTransform: "uppercase", color: p.value === "N/A" ? safeColors.muted : safeColors.text }}>
                    {p.value !== "N/A" ? p.value : p.row.username_attempt}
                </Typography>
            </Box>
        )},
        { field: "event_display", headerName: "ÉVÉNEMENT", width: 200, renderCell: (p) => {
            const isAlert = p.row.success === false;
            return (
                <Typography sx={{ fontWeight: "bold", color: isAlert ? safeColors.red : safeColors.green }}>
                    {isAlert ? <GppBad sx={{ fontSize: 14, mr: 0.5, verticalAlign: "middle" }}/> : <GppGood sx={{ fontSize: 14, mr: 0.5, verticalAlign: "middle" }}/>}
                    {p.value}
                </Typography>
            );
        }},
        { field: "ip_address", headerName: "IP SOURCE", width: 140, renderCell: (p) => (
            <Typography sx={{ fontFamily: "monospace", color: safeColors.blueDark, bgcolor: alpha(safeColors.blue, 0.1), p: 0.5, borderRadius: "4px" }}>
                {p.value || "Inconnue"}
            </Typography>
        )},
        { field: "location", headerName: "GÉOLOCALISATION", flex: 1, renderCell: (p) => (
            <Box display="flex" alignItems="center" gap={1}>
                <Public sx={{ fontSize: "16px", color: safeColors.muted }} />
                <Typography variant="caption" sx={{ textTransform: "uppercase" }}>
                    {p.row.city && p.row.country ? `${p.row.city}, ${p.row.country}` : "NON IDENTIFIÉ"}
                </Typography>
            </Box>
        )},
        { field: "actions", headerName: "ANALYSE", width: 100, sortable: false, renderCell: (p) => (
            <Tooltip title="Ouvrir le rapport d'investigation">
                <IconButton sx={{ color: p.row.risk_level === 'HIGH' ? safeColors.red : safeColors.blue }} onClick={() => setSelectedThreat(p.row)}>
                    <Radar />
                </IconButton>
            </Tooltip>
        )}
    ];

    return (
        <Box m="25px" component={motion.div} initial={{ opacity: 0, filter: "blur(5px)" }} animate={{ opacity: 1, filter: "blur(0px)" }}>
            
            {/* 🚀 HEADER CYBER-GOUV AVEC ALARME SI CRITIQUE */}
            <Paper elevation={0} sx={{ 
                p: 3, mb: 4, 
                background: isDark 
                    ? `linear-gradient(135deg, ${alpha(safeColors.primaryBg, 0.95)} 0%, ${alpha('#000', 0.8)} 100%)`
                    : `linear-gradient(135deg, #ffffff 0%, ${alpha(safeColors.muted, 0.1)} 100%)`,
                border: `1px solid ${stats.critical > 0 ? safeColors.red : safeColors.blue}`,
                borderLeft: `8px solid ${stats.critical > 0 ? safeColors.red : safeColors.blue}`,
                borderRadius: "15px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                position: "relative", overflow: "hidden",
                boxShadow: stats.critical > 0 ? `0 0 30px ${alpha(safeColors.red, 0.2)}` : "none"
            }}>
                <Radar sx={{ position: "absolute", left: "15%", bottom: "-40px", fontSize: "250px", opacity: 0.03, color: safeColors.blue }} />

                <Box component="img" src={sceauRdc} sx={{ height: 80, filter: isDark ? "drop-shadow(0 0 10px rgba(255,255,255,0.2))" : "none" }} />
                
                <Box textAlign="center" zIndex={1}>
                    <Typography variant="h2" fontWeight="900" sx={{ letterSpacing: "3px", color: isDark ? "#fff" : safeColors.blueDark }}>
                        CENTRE DE CYBERSÉCURITÉ
                    </Typography>
                    <Typography variant="h5" fontWeight="800" sx={{ mt: 1, color: stats.critical > 0 ? safeColors.red : safeColors.blue, textTransform: "uppercase" }}>
                        Surveillance des Accès & Détection d'Intrusions
                    </Typography>
                    
                    {/* BANNIÈRE ALERTE SI DANGER */}
                    <AnimatePresence>
                        {stats.critical > 0 && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                                <Box sx={{ mt: 2, display: "inline-flex", alignItems: "center", gap: 1, bgcolor: alpha(safeColors.red, 0.2), p: 1, px: 3, borderRadius: "20px", border: `1px solid ${safeColors.red}` }}>
                                    <WarningAmber sx={{ color: safeColors.red }} />
                                    <Typography variant="subtitle2" sx={{ color: safeColors.red, fontWeight: "bold", letterSpacing: "1px" }}>
                                        ATTENTION : {stats.critical} MENACE(S) CRITIQUE(S) DÉTECTÉE(S)
                                    </Typography>
                                </Box>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Box>

                {/* 🔴 DRAPEAU RDC EN ROND */}
                <Avatar 
                    src={drapeauRdc} 
                    sx={{ 
                        width: 90, height: 90, 
                        border: `4px solid ${safeColors.blueDark}`, 
                        boxShadow: `0 0 20px ${alpha(safeColors.blue, 0.4)}` 
                    }} 
                />
            </Paper>

            {/* 📊 DASHBOARD STATS RAPIDES */}
            <Grid container spacing={3} mb={4}>
                {[
                    { label: "TENTATIVES ENREGISTRÉES", val: stats.total, icon: <Shield />, col: safeColors.blue },
                    { label: "COMPTES VERROUILLÉS", val: stats.locked, icon: <PersonOff />, col: safeColors.orange },
                    { label: "INTRUSIONS CRITIQUES", val: stats.critical, icon: <GppBad />, col: safeColors.red, pulse: true }
                ].map((s, i) => (
                    <Grid item xs={12} md={4} key={i}>
                        <Paper component={motion.div} whileHover={{ y: -5 }} sx={{ 
                            p: 2.5, borderRadius: "10px", bgcolor: alpha(s.col, 0.05), borderBottom: `4px solid ${s.col}`,
                            display: "flex", alignItems: "center", gap: 2,
                            ...(s.pulse && stats.critical > 0 ? { animation: "pulse 2s infinite" } : {})
                        }}>
                            <Avatar sx={{ bgcolor: s.col, width: 55, height: 55 }}>{s.icon}</Avatar>
                            <Box>
                                <Typography variant="h3" fontWeight="900" sx={{ color: safeColors.text }}>{s.val}</Typography>
                                <Typography variant="caption" fontWeight="bold" sx={{ opacity: 0.7, color: safeColors.text, letterSpacing: "1px" }}>{s.label}</Typography>
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* 📑 TABLEAU LECTURE SEULE */}
            <Box height="55vh" sx={{
                "& .MuiDataGrid-root": { border: `1px solid ${alpha(safeColors.muted, 0.2)}`, borderRadius: "10px" },
                "& .MuiDataGrid-cell": { borderBottom: `1px solid ${alpha(safeColors.muted, 0.1)}` },
                "& .MuiDataGrid-columnHeaders": { backgroundColor: safeColors.primaryBg, color: safeColors.text, borderBottom: `2px solid ${safeColors.blueDark}` },
                "& .MuiDataGrid-row.critique": { backgroundColor: alpha(safeColors.red, 0.05) }, // Légère teinte rouge pour les lignes critiques
            }}>
                <DataGrid 
                    rows={data} 
                    columns={columns} 
                    components={{ Toolbar: GridToolbar }}
                    loading={loading}
                    disableSelectionOnClick
                    density="comfortable"
                    getRowClassName={(params) => params.row.risk_level === 'HIGH' ? 'critique' : ''}
                />
            </Box>

            {/* 🔬 MODAL D'INVESTIGATION DE SÉCURITÉ */}
            <AnimatePresence>
                {selectedThreat && (
                    <Dialog open={Boolean(selectedThreat)} onClose={() => setSelectedThreat(null)} maxWidth="sm" fullWidth PaperProps={{
                        component: motion.div, initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 },
                        sx: { bgcolor: safeColors.gridBg, borderRadius: "15px", border: `2px solid ${selectedThreat.risk_level === 'HIGH' ? safeColors.red : safeColors.blue}` }
                    }}>
                        <DialogTitle sx={{ 
                            bgcolor: selectedThreat.risk_level === 'HIGH' ? alpha(safeColors.red, 0.1) : alpha(safeColors.blue, 0.1), 
                            display: "flex", alignItems: "center", gap: 2, pb: 2
                        }}>
                            {selectedThreat.risk_level === 'HIGH' ? <WarningAmber color="error" fontSize="large" /> : <Radar color="primary" fontSize="large" />}
                            <Box>
                                <Typography variant="h4" fontWeight="900">RAPPORT D'ANOMALIE</Typography>
                                <Typography variant="caption" color={safeColors.muted}>ID: {selectedThreat.id}</Typography>
                            </Box>
                        </DialogTitle>
                        
                        <DialogContent sx={{ mt: 3 }}>
                            <Grid container spacing={3}>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color={safeColors.muted} display="block">IDENTIFIANT TESTÉ</Typography>
                                    <Typography variant="h6" fontWeight="bold">{selectedThreat.username_attempt || selectedThreat.agent_name}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color={safeColors.muted} display="block">ADRESSE IP</Typography>
                                    <Typography variant="h6" fontWeight="bold" sx={{ fontFamily: "monospace", color: safeColors.red }}>{selectedThreat.ip_address}</Typography>
                                </Grid>
                                
                                <Grid item xs={12}>
                                    <Divider sx={{ my: 1 }} />
                                </Grid>

                                <Grid item xs={12}>
                                    <Typography variant="caption" color={safeColors.muted} display="block">USER AGENT (EMPREINTE NAVIGATEUR)</Typography>
                                    <Paper sx={{ p: 1.5, mt: 0.5, bgcolor: isDark ? "#0d1117" : "#f6f8fa", fontFamily: "monospace", fontSize: "11px", wordBreak: "break-all" }}>
                                        {selectedThreat.user_agent || "Aucune empreinte détectée (Suspicion de Bot)"}
                                    </Paper>
                                </Grid>

                                <Grid item xs={12}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={2} p={2} sx={{ bgcolor: alpha(safeColors.muted, 0.1), borderRadius: "8px" }}>
                                        <Box>
                                            <Typography variant="caption" color={safeColors.muted} display="block">STATUT FINAL</Typography>
                                            <Typography variant="body1" fontWeight="bold" color={selectedThreat.success ? safeColors.green : safeColors.red}>
                                                {selectedThreat.success ? "ACCÈS AUTORISÉ" : "ACCÈS REJETÉ"}
                                            </Typography>
                                        </Box>
                                        <Box textAlign="right">
                                            <Typography variant="caption" color={safeColors.muted} display="block">LOCALISATION</Typography>
                                            <Typography variant="body1" fontWeight="bold">
                                                {selectedThreat.city ? `${selectedThreat.city}, ${selectedThreat.country}` : "Inconnue"}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                            </Grid>
                        </DialogContent>
                    </Dialog>
                )}
            </AnimatePresence>
            
            {/* CSS inline pour l'animation de pulsation globale */}
            <style>
                {`
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.02); box-shadow: 0 0 15px ${alpha(safeColors.red, 0.5)}; }
                    100% { transform: scale(1); }
                }
                `}
            </style>
        </Box>
    );
};

export default AuthAuditDashboard;