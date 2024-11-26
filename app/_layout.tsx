import React, { useState } from 'react';
import { StyleSheet, TextInput, Button, View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function HomeScreen() {
  const [url, setUrl] = useState('https://atlasbroker.io/traderoom');
  const [webViewUrl, setWebViewUrl] = useState('https://atlasbroker.io/');

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleLoadSite = () => {
    if (isValidUrl(url)) {
      setWebViewUrl(url); // Atualiza a URL da WebView
    } else {
      // Alert.alert('Erro', 'Por favor, insira uma URL válida (ex: https://google.com)');
    }
  };

  // Função para lidar com mensagens da WebView
  const handleWebViewMessage = (event: any) => {
    console.log('Mensagem recebida da WebView:', event.nativeEvent.data);
  };
  // Código injetado para interceptar requisições de rede
  const debugging = `
    (function() {
      // Interceptando o fetch
      const originalFetch = window.fetch;
      window.fetch = function() {
        const args = arguments;
        const request = {
          url: args[0],
          method: args[1]?.method || 'GET',
          headers: args[1]?.headers || {},
          body: args[1]?.body || null,
        };

        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'request', data: request }));

        return originalFetch.apply(window, args).then(response => {
          response.clone().text().then(body => {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'response',
              data: { url: args[0], status: response.status, body }
            }));
          });
          return response;
        });
      };

      // Interceptando XMLHttpRequest
      const originalOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function(method, url) {
        this.addEventListener('load', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'response',
            data: { url, status: this.status, body: this.responseText }
          }));
        });
        originalOpen.apply(this, arguments);
      };
    })();
  `;

  interface WebViewMessageEvent {
    nativeEvent: {
      data: string;
    };
  }

  interface DataPayload {
    type: string;
    data: any;
  }

  const onMessage = (payload: WebViewMessageEvent) => {
    let dataPayload: DataPayload | undefined;
    try {
      dataPayload = JSON.parse(payload.nativeEvent.data);
    } catch (e) {}

    if (dataPayload) {
      if (dataPayload.type === 'request') {
        console.log('[Requisição] ', dataPayload.data);
      } else if (dataPayload.type === 'response') {
        console.log('[Resposta] ', dataPayload.data);
      } else {
        console.log(dataPayload);
      }
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Cabeçalho simplificado */}
      <View style={styles.header}>
        {/* <Text style={styles.headerText}>Welcome</Text> */}
      </View>

      {/* Campo de texto e botão para abrir o site */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Digite a URL do site (ex: https://google.com)"
          value={url}
          onChangeText={setUrl}
        />
        <Button title="Abrir Site" onPress={handleLoadSite} />
      </View>

      {/* WebView para exibir o site */}
      {webViewUrl ? (
        <WebView
          originWhitelist={['*']}
          onLoad={() => console.log('WebView loaded')}
          source={{ uri: webViewUrl }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          injectedJavaScript={debugging}
          onMessage={onMessage} // Captura as mensagens enviadas pela WebView
          keyboardDisplayRequiresUserAction={false}
        />
      ) : (
        <View style={styles.placeholder}>
          {/* <Text>Digite uma URL e clique em "Abrir Site".</Text> */}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 50, // Altura do cabeçalho
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#A1CEDC', // Cor de fundo
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D3D47', // Cor do texto
  },
  inputContainer: {
    padding: 16,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
