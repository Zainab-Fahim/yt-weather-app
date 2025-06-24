import './App.css';
import Chat from './Chat';
import { Container, CssBaseline } from '@mui/material';

function App() {
  return (
    <>
      <CssBaseline />
      <Container maxWidth="md" sx={{ display: 'flex', alignItems: 'center', height: '100vh' }}>
        <Chat />
      </Container>
    </>
  );
}

export default App;
