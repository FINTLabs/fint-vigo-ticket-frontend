import React from 'react';
import './App.css';
import {BrowserRouter} from 'react-router-dom';
import {Provider} from "react-redux";
import store from './data/redux/store';
import Scaffold from "./common/scaffold/scaffold";
import {createMuiTheme, MuiThemeProvider} from "@material-ui/core";

const theme = createMuiTheme({
    palette: {
        primary: {
            main: '#fff',
            dark: '#666666',
        },
        secondary: {
            main: '#8cc640',
            contrastText: '#fff',
        },
    },
    status: {
        danger: 'orange',
    },
});

function App() {
    return (
        <MuiThemeProvider theme={theme}>
            <Provider store={store}>
                <BrowserRouter basename="/">
                    <Scaffold/>
                </BrowserRouter>
            </Provider>
        </MuiThemeProvider>
    );
}

export default App;
