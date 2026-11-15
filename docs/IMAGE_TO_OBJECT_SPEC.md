# Lembranças 3D nos álbuns

Branch de revisão `Image_to_object_feature`. A proposta aprovada combina reconhecimento local, modelos estilizados e sincronização de páginas entre contas reais.

## Critérios de aceite

1. O autor pode anexar uma foto JPEG ou PNG na composição da página. Publicar somente texto ou foto continua disponível. O editor preserva o fluxo de foto e rascunho existente na demo.
2. Clicar na foto abre uma pergunta. **Manter foto** fecha a pergunta e preserva a imagem 2D. **Sim, transformar** inicia o reconhecimento local de gato, cachorro, pássaro, urso de pelúcia, avião, carro, garrafa ou copo. Uma imagem inconclusiva permanece em 2D.
3. Após o reconhecimento, fragmentos da foto se dobram e dão lugar à miniatura **cartoon facetada**. A câmera inicia aproximadamente 58° acima do papel e a sombra acompanha a base do objeto. A miniatura permanece diretamente na página, no ângulo da composição. A preferência de movimento reduzido pula a animação.
4. Em repouso, a folha mostra apenas a miniatura e a sombra no lugar da foto. Passar o mouse sobre a silhueta revela um indicador discreto. Pressionar e arrastar a miniatura gira a malha em qualquer direção, mantendo a base apoiada no papel e a câmera fixa. Passar o mouse, arrastar o papel ou rolar a página preserva a orientação. Um clique ou toque simples na miniatura abre a avaliação de 1 a 5, a geração de outra variação, a restauração da orientação e a opção de voltar à foto. Pelo teclado, Tab foca a miniatura, as setas giram, Home restaura e Enter abre a avaliação.
5. Duas contas independentes entram no mesmo álbum por convite. A publicação envia a foto comprimida e, se já gerada, a geometria parametrizada. A transformação posterior atualiza a página de todos os membros. Cada pessoa pode girar a miniatura localmente. O check-in pessoal permanece no dispositivo.
6. Um terceiro usuário sem convite não pode ler nem escrever nesse álbum. A autoria vem da sessão. Uma repetição do mesmo pedido de publicação cria uma única página. Conflitos de revisão impedem que uma edição antiga sobrescreva uma recente.
7. A página continua legível sem WebGL. A interface oferece comandos utilizáveis por teclado. A publicação de uma foto ou de um texto independe do download e da execução do detector.

## Arquitetura e revisão

- A foto passa pelo compressor existente. COCO-SSD fornece classe e caixa delimitadora. Um classificador MobileNet local verifica a distinção entre cães e gatos. A malha usa a cor e a proporção da região detectada; cada variação é reproduzível pela descrição versionada.
- Reconhecimento ocorre por ação explícita. O servidor recebe os dados da página ao publicar em um álbum com membros reais. A geração não exige chave, chamada a um serviço de IA ou GPU de servidor.
- Servidor Node com SQLite em volume persistente, senhas com scrypt, sessões por cookie HttpOnly e associação explícita de membros. O cliente verifica novidades enquanto o álbum está aberto.
- Revisão em três passos: foto e prévia; aprovação e publicação; segunda conta visualizando e manipulando a página. Conferir também rejeição, cancelamento e a opção de manter somente a foto.
