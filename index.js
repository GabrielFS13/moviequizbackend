import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import axios from 'axios'
const app = express()
const PORT = process.env.PORT || 3002
const API_KEY = process.env.API_KEY
const MOVIE_KEY = process.env.API_MDB



async function pegaEmoji(overview, title){
    const completion = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
            { role: "system", content: "You will receive a title and overview of a movie, you have to transform both of them to ONLY EMOJIS" },
            { role: "user", content:  `title: ${title} overview: ${overview}`}
        ],
        max_tokens: 50 
    }, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        }
    })
    return completion.data.choices[0]
}

async function pegaFilme(genero_id){
    const movieID = Math.floor(Math.random() * 50 + 1)
    const movieIndex = Math.floor(Math.random() * 20 + 1)
    let conexaoString = ''
    if(genero_id){
        conexaoString = `https://api.themoviedb.org/3/discover/movie?api_key=${MOVIE_KEY}&language=en-US&page=${movieID}&with_genres=${genero_id}`
    }else{
        conexaoString = `https://api.themoviedb.org/3/discover/movie?api_key=${MOVIE_KEY}&language=en-US&page=${movieID}`
    }
    const conexao = await fetch(conexaoString).catch(err => console.log(err))
    const dados = await conexao.json()
    return dados.results[movieIndex]
}

async function traduzFilme(id){
    const conn = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${MOVIE_KEY}&language=pt-BR`).catch(err => console.log(err))
    const data = await conn.json()

    return data
}

async function montaQuiz(gen_id = false){
    var filme = await pegaFilme(gen_id)
    var emojis = await pegaEmoji(filme.overview, filme.original_title) 
    var traduzido = await traduzFilme(filme.id)
    while(emojis === "\n\n🤷‍♂️" || emojis === "\n\n❓" || emojis === "\n\n🤔🤷‍♂️🤷‍♀️" || traduzido.overview === ''){
        filme = await pegaFilme(gen_id)
        emojis = await pegaEmoji(filme.overview, filme.original_title)
        traduzido = await traduzFilme(filme.id)

    }
 
    return {
        emojis, 
            hints: {
            release_date: filme.release_date,
            overview: traduzido.overview.slice(0, 50) + "...",
        },
        poster: 'https://image.tmdb.org/t/p/original/'+filme.poster_path,
        answer: traduzido.title,
        original: filme.original_title
    }
}

app.use(cors())


app.get('/', cors(), async (req, res) =>{
    res.json(await montaQuiz())
})

app.get('/genero/:id', cors(), async (req, res) =>{
    res.json(await montaQuiz(req.params.id))
})


app.listen(PORT, () =>{
    console.log("Server ON!", PORT)
})