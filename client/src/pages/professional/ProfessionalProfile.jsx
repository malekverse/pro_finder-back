import React, { useState, useEffect } from 'react';
import {
  Box, Container, Card, CardContent, Typography, Button, TextField,
  IconButton, Avatar, Grid, Divider, Paper, Stack, CircularProgress, InputAdornment
} from '@mui/material';
import { useSelector } from 'react-redux';
import {
  PhotoCamera, Edit, Save, Language, Email, Phone, Place, Lock
} from '@mui/icons-material';

import { useGetProfessionalProfileQuery, useUpdateProfessionalProfileMutation } from '../../redux/features/professional/professionalApiSlice';
import Autocomplete from "../../components/auth/Autocomplete";
import { toImageUrl } from "../../utils/imageUtils";

const SERVER_URL = 'http://localhost:5000';

const ProfessionalProfile = () => {
  const { data: profileData, isLoading: isFetching } = useGetProfessionalProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfessionalProfileMutation();

  const [editMode, setEditMode] = useState(false);
  const [inputs, setInputs] = useState({
    fullName: '', description: '', website: '', email: '', phone: '',
    photoFile: null,
    country: '', region: '', city: '',
  });

  const [preview, setPreview] = useState(null);

  const [countries, setCountries] = useState([]);
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);

  // ─── Charger les données du profil ───────────────────────────────────────
  useEffect(() => {
    if (profileData) {
      setInputs(prev => ({
        ...prev,
        fullName: profileData.fullName || '',
        description: profileData.description || '',
        website: profileData.website || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        country: profileData.country || '',
        region: profileData.region || '',
        city: profileData.city || '',
        photoFile: null,
      }));

      setPreview(toImageUrl(profileData.photoProfessional));
    }
  }, [profileData]);

  // ─── Localisation ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${SERVER_URL}/localisation/getCountries`)
      .then(res => res.json()).then(setCountries);
  }, []);

  useEffect(() => {
    if (inputs.country) {
      fetch(`${SERVER_URL}/localisation/getRegionsByCountry/${inputs.country}`)
        .then(res => res.json())
        .then(data => setRegions(Array.isArray(data.regions) ? data.regions : []))
        .catch(err => {
          console.error("Error fetching regions:", err);
          setRegions([]);
        });
    }
  }, [inputs.country]);

  useEffect(() => {
    if (inputs.region) {
      fetch(`${SERVER_URL}/localisation/getCitiesByRegion/${inputs.region}`)
        .then(res => res.json())
        .then(data => setCities(Array.isArray(data) ? data : []))
        .catch(err => {
          console.error("Error fetching cities:", err);
          setCities([]);
        });
    }
  }, [inputs.region]);

  // ─── Sélection d'un fichier image ────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (preview?.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }

    setInputs(prev => ({ ...prev, photoFile: file }));
    setPreview(URL.createObjectURL(file));
  };

  // ─── Sauvegarde ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    try {
      const formData = new FormData();
      formData.append('fullName', inputs.fullName);
      formData.append('description', inputs.description);
      formData.append('website', inputs.website);
      formData.append('phone', inputs.phone);
      formData.append('country', inputs.country);
      formData.append('region', inputs.region);
      formData.append('city', inputs.city);

      if (inputs.photoFile instanceof File) formData.append('photoProfessional', inputs.photoFile);

      await updateProfile(formData).unwrap();
      setEditMode(false);
    } catch (err) {
      console.error("Erreur de mise à jour:", err);
    }
  };

  if (isFetching) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>

      {/* ── HEADER ── */}
      <Card elevation={0} sx={{ borderRadius: 4, overflow: 'visible', mb: 3, border: '1px solid #e0e0e0' }}>

        {/* Cover gradient */}
        <Box sx={{ position: 'relative', height: 180, background: 'linear-gradient(135deg, #1E3A5F 0%, #3b82f6 100%)', borderRadius: '16px 16px 0 0', overflow: 'hidden' }} />

        <CardContent sx={{ position: 'relative', pt: 0, px: 4, pb: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'flex-end', mt: -10 }}>

            {/* Photo */}
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={preview}
                sx={{ width: 160, height: 160, border: '4px solid white', bgcolor: 'white', boxShadow: '0 0 0 1px rgba(0,0,0,0.1)', borderRadius: '50%' }}
              />
              {editMode && (
                <label htmlFor="photo-input">
                  <input
                    id="photo-input"
                    type="file"
                    hidden
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={handleFileChange}
                  />
                  <IconButton component="span" size="small" sx={{ position: 'absolute', bottom: 12, right: 12, bgcolor: '#f8fafc', boxShadow: 1, border: '1px solid #e2e8f0' }}>
                    <PhotoCamera fontSize="small" color="primary" />
                  </IconButton>
                </label>
              )}
            </Box>

            {/* Nom + Ville */}
            <Box sx={{ ml: { md: 3 }, flexGrow: 1, mb: 1, mt: { xs: 2, md: 0 } }}>
              <Typography variant="h4" fontWeight="700" color="#000000e6">
                {inputs.fullName || "Nom du professionnel"}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Place fontSize="small" />
                {inputs.city && Array.isArray(cities)
                  ? `${cities.find(c => c._id === inputs.city)?.name || "Chargement..."}`
                  : "Localisation non définie"}
              </Typography>
            </Box>

            {/* Boutons */}
            <Box sx={{ mb: 1 }}>
              {!editMode ? (
                <Button
                  variant="contained"
                  startIcon={<Edit />}
                  onClick={() => setEditMode(true)}
                  sx={{ borderRadius: 10, px: 3, bgcolor: '#1E3A5F', textTransform: 'none', fontWeight: '600' }}
                >
                  Modifier le profil
                </Button>
              ) : (
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<Save />}
                    onClick={handleSave}
                    disabled={isUpdating}
                    sx={{ borderRadius: 10, textTransform: 'none', px: 3 }}
                  >
                    {isUpdating ? <CircularProgress size={24} color="inherit" /> : 'Enregistrer'}
                  </Button>
                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={() => setEditMode(false)}
                    sx={{ borderRadius: 10, textTransform: 'none', px: 3 }}
                  >
                    Annuler
                  </Button>
                </Stack>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* ── SECTION INFOS ── */}
      <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #e0e0e0' }}>
        {editMode ? (
          <Box>
            <Typography variant="h6" fontWeight="600" sx={{ mb: 3 }}>Modifier les informations</Typography>
            <Grid container spacing={3}>
              <Grid size={12}>
                <TextField fullWidth label="Nom Complet" value={inputs.fullName} onChange={(e) => setInputs({ ...inputs, fullName: e.target.value })} />
              </Grid>
              <Grid size={12}>
                <TextField fullWidth multiline rows={4} label="Description" value={inputs.description} onChange={(e) => setInputs({ ...inputs, description: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth label="Site Web" value={inputs.website} onChange={(e) => setInputs({ ...inputs, website: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Email"
                  value={inputs.email}
                  disabled
                  variant="filled"
                  InputProps={{
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth label="Téléphone" value={inputs.phone} onChange={(e) => setInputs({ ...inputs, phone: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Autocomplete label="Pays" options={countries} value={countries.find(c => c._id === inputs.country) || null} onSelect={(c) => setInputs({ ...inputs, country: c?._id })} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Autocomplete label="Région" options={regions} value={regions.find(r => r._id === inputs.region) || null} onSelect={(r) => setInputs({ ...inputs, region: r?._id })} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Autocomplete label="Ville" options={cities} value={cities.find(c => c._id === inputs.city) || null} onSelect={(c) => setInputs({ ...inputs, city: c?._id })} />
              </Grid>
            </Grid>
          </Box>
        ) : (
          <Box>
            <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>À propos</Typography>
            <Typography variant="body1" sx={{ color: '#000000df', mb: 4, whiteSpace: 'pre-line', lineHeight: 1.6 }}>
              {inputs.description || "Aucune description disponible."}
            </Typography>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" fontWeight="600" sx={{ mb: 3 }}>Coordonnées</Typography>
            <Grid container spacing={4}>
              <ContactInfo icon={<Language color="primary" />} label="Site Web" value={inputs.website} isLink />
              <ContactInfo icon={<Email color="primary" />} label="Email" value={inputs.email} />
              <ContactInfo icon={<Phone color="primary" />} label="Téléphone" value={inputs.phone} />
              <ContactInfo
                icon={<Place color="primary" />}
                label="Adresse"
                value={
                  inputs.city && Array.isArray(cities) && Array.isArray(regions) && Array.isArray(countries)
                    ? `${cities.find(c => c._id === inputs.city)?.name || ""}, ${regions.find(r => r._id === inputs.region)?.name || ""}, ${countries.find(c => c._id === inputs.country)?.name || ""}`
                    : "Localisation non définie"
                }
              />
            </Grid>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

const ContactInfo = ({ icon, label, value, isLink }) => (
  <Grid size={{ xs: 12, sm: 6 }}>
    <Stack direction="row" spacing={2} alignItems="center">
      <Box sx={{ bgcolor: '#f0f4f8', p: 1.5, borderRadius: 2, display: 'flex' }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: '700', textTransform: 'uppercase' }}>{label}</Typography>
        <Typography variant="body1" sx={{ fontWeight: 500, color: isLink ? '#0a66c2' : 'inherit', cursor: isLink ? 'pointer' : 'default' }}>
          {value || "Non renseigné"}
        </Typography>
      </Box>
    </Stack>
  </Grid>
);

export default ProfessionalProfile;
