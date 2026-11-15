# Lembranças 3D nos álbuns

Branch de revisão `Image_to_object_feature`. A proposta aprovada combina reconhecimento local, modelos estilizados e sincronização de páginas entre contas reais.

## Critérios de aceite

1. O autor pode anexar uma foto JPEG ou PNG na composição da página. Publicar somente texto ou foto continua disponível. O editor preserva o fluxo de foto e rascunho existente na demo.
2. Clicar na foto abre uma pergunta. **Manter foto** fecha a pergunta e preserva a imagem 2D. **Sim, transformar** inicia o reconhecimento local de gato, cachorro, pássaro, urso de pelúcia, avião, carro, garrafa ou copo. Uma imagem inconclusiva permanece em 2D.
3. Após o reconhecimento, fragmentos da foto se dobram e dão lugar à miniatura **cartoon facetada**. A câmera inicia aproximadamente 58° acima do papel e a sombra acompanha a base do objeto. A miniatura permanece diretamente na página, no ângulo da composição. A preferência de movimento reduzido pula a animação.
4. É possível girar, aproximar, retornar à vista de cima, avaliar de 1 a 5, pedir outra variação facetada e voltar à foto original. A transformação funciona na composição e em páginas já publicadas. A interação com a IA usa controles fechados.
5. Duas contas independentes entram no mesmo álbum por convite. A publicação envia a foto comprimida e, se já gerada, a geometria parametrizada. A transformação posterior atualiza a página de todos os membros; cada pessoa controla a própria câmera. O check-in pessoal permanece no dispositivo.
6. Um terceiro usuário sem convite não pode ler nem escrever nesse álbum. A autoria vem da sessão. Uma repetição do mesmo pedido de publicação cria uma única página. Conflitos de revisão impedem que uma edição antiga sobrescreva uma recente.
7. A página continua legível sem WebGL. A interface oferece comandos utilizáveis por teclado. A publicação de uma foto ou de um texto independe do download e da execução do detector.

## Arquitetura e revisão

- A foto passa pelo compressor existente. COCO-SSD fornece classe e caixa delimitadora. Um classificador MobileNet local verifica a distinção entre cães e gatos. A malha usa a cor e a proporção da região detectada; cada variação é reproduzível pela descrição versionada.
- Reconhecimento ocorre por ação explícita. O servidor recebe os dados da página ao publicar em um álbum com membros reais. A geração não exige chave, chamada a um serviço de IA ou GPU de servidor.
- Servidor Node com SQLite em volume persistente, senhas com scrypt, sessões por cookie HttpOnly e associação explícita de membros. O cliente verifica novidades enquanto o álbum está aberto.
- Revisão em três passos: foto e prévia; aprovação e publicação; segunda conta visualizando e manipulando a página. Conferir também rejeição, cancelamento e a opção de manter somente a foto.
