import express from "express";

const { BACKYARD_SERVER_SECRET } = process.env;

export const graphiql = (req: express.Request, res: express.Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");

  res.send(`
<html>
  <head>
    <title>Simple GraphiQL Example</title>
    <link href="https://unpkg.com/graphiql/graphiql.min.css" rel="stylesheet" />
  </head>
  <body style="margin: 0;">
    <div id="graphiql" style="height: 100vh;"></div>

    <script
      crossorigin
      src="https://unpkg.com/react/umd/react.production.min.js"
    ></script>
    <script
      crossorigin
      src="https://unpkg.com/react-dom/umd/react-dom.production.min.js"
    ></script>
    <script
      crossorigin
      src="https://unpkg.com/graphiql/graphiql.min.js"
    ></script>

    <script>
        function graphQLFetcher(graphQLParams) {
            return fetch(
            window.location.origin + '/graphql',
          {
            method: 'post',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + '${BACKYARD_SERVER_SECRET}'
            },
            body: JSON.stringify(graphQLParams),
            credentials: 'omit',
          },
        ).then(function (response) {
          return response.json().catch(function () {
            return response.text();
          });
        });
      }

      ReactDOM.render(
        React.createElement(GraphiQL, {
          fetcher: graphQLFetcher,
          defaultVariableEditorOpen: true,
        }),
        document.getElementById('graphiql'),
      );
    </script>
  </body>
</html>
  `);
};
