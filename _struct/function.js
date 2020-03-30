const pool = require('./database.js');
const logger = require('./logger.js');
//var genMatricule = require('genMatricule.js');



//==================================================//
//                Edit Users Table                  //
//==================================================//

module.exports.profileCreate = async (msg, user, guild) => {

    let matricule = '242-4242';
    while(true) {
        let id = Math.round(Math.random() *10000);
        matricule = `242-${id < 100?'00'+id:id < 1000?'0'+id:id}`;
        let matricule_response = await pool.query('SELECT id FROM "Users" WHERE matricule = $1', [matricule]);
        if(matricule_response.rowCount < 1) break;
    }

    pool.connect( (err, client, done) => {
        //Create a profile
        client.query('INSERT INTO "Users" (username, user_id, guild_id, matricule) VALUES ($1, $2, $3, $4)',
            [user.username, user.id, guild.id, matricule], (err, result) => {
            if(err) {
                if(err.code == 23505) {
                    logger(`The profile of $c{magenta:${user.tag}}} is already in the database.`);
                    if(msg) msg.reply(`Le profil existe déjà.`);
                }else console.log(err);
            }else {
                logger(`The profile of $c{magenta:${user.tag}}}" was successfully created with the registration number : ${matricule}.`);
                if(msg) msg.reply(`Le profil a été créé avec succès.`);
                client.query('SELECT user_id FROM "Users" WHERE id IN (SELECT inviter_id FROM "Invites" WHERE user_id = $1 AND guild_id = $2)',
                    [user.id,guild.id], (err, results) => {
                    if(results.rowCount < 1) return;
                    let inviter = guild.members.get(results.rows[0].user_id);
                    this.addInviteScore(guild, inviter.user);
                });
            }
            done();
        });
    });

}


module.exports.addXP = (msg, xp_amount, user, guild) => {
    //Update the user xp
    pool.query('UPDATE "Users" SET xp = xp + $1 WHERE user_id = $2 AND guild_id = $3 RETURNING xp,reputation', [xp_amount, user.id, msg?msg.guild.id:guild.id]).then(results => {
        let data = results.rows[0];
        if(data.xp < (data.reputation*100)+100) return;
        let level = 0;
        while(data.xp > (data.reputation*100)+100) {
            data.xp -= (data.reputation*100)+100;
            data.reputation++;
            level++;
        }
        pool.query('UPDATE "Users" SET xp = $1 WHERE user_id = $2 AND guild_id = $3', [data.xp, user.id, msg?msg.guild.id:guild.id]);
        this.addLVL(msg?msg:null, level, user, guild);
    });
}

module.exports.delXP = (msg, xp_amount, user, guild) => {
    //Update the user xp
    pool.query('UPDATE "Users" SET xp = xp - $1 WHERE user_id = $2 AND guild_id = $3 RETURNING xp,reputation', [xp_amount, user.id, msg?msg.guild.id:guild.id]).then(results => {
        let data = results.rows[0];
        if(data.xp > 0) return;
        let level = 0;
        while(data.xp < 0) {
            if(data.reputation <= 0) {
                data.xp = 0; 
                break;
            }
            data.xp += (data.reputation*100)+100;
            data.reputation--;
            level++;
        }
        pool.query('UPDATE "Users" SET xp = $1 WHERE user_id = $2 AND guild_id = $3', [data.xp, user.id, msg.guild.id]);
        this.delLVL(msg?msg:null, level, user, guild);
    });
}


module.exports.addLVL = (msg, lvl_amount, user, guild) => {
    pool.connect( (err, client, done) => {
        //Update the user lvl
        client.query('SELECT id, reputation FROM "Users" WHERE user_id = $1 AND guild_id = $2', [user.id, msg?msg.guild.id:guild.id], (err, results) => {
            var multiplicator = 1;
            client.query('SELECT level FROM "SkillUser" WHERE id = $1 AND skill_id = 9', [results.rows[0].id], async (err, result) => {
                if(result.rowCount > 0) {
                    multiplicator = 1+((result.rows[0].level)*0.2);
                }
                var coinReward = 0;
                for (var i = 1; i <= lvl_amount; i++) {
                    coinReward += ((results.rows[0].reputation)+i)*10*(multiplicator);
                }
                let res = await pool.query('UPDATE "Users" SET reputation = reputation + $1 WHERE user_id = $2 AND guild_id = $3 RETURNING *', [lvl_amount, user.id, msg?msg.guild.id:guild.id]);
                if(res.rows[0].reputation === 10) {
                    client.query('SELECT user_id FROM "Users" WHERE id IN (SELECT inviter_id FROM "Invites" WHERE user_id = $1 AND guild_id = $2)',[user.id, msg?msg.guild.id:guild.id], (err, r) => {
                        if(r.rowCount < 1) return;
                        let inviter = msg?msg.guild.members.get(r.rows[0].user_id):guild.members.get(r.rows[0].user_id);
                        this.addInviteScore(msg?msg.guild:guild, inviter.user);
                    });
                }
                this.addCoin(msg?msg:null, coinReward, user, guild);
                logger(`$c{magenta:${user.username}}} reached the level $c{magenta:${(results.rows[0].reputation)+lvl_amount}}} on $c{magenta:${msg?msg.guild.name:guild.name}}}.`);
                msg.channel.send(`<@${user.id}>, Vous gagnez en réputation. Vous avez maintenant : ${(results.rows[0].reputation)+lvl_amount} de réputation. Vous gagnez également un bonus de : ${coinReward} trombones.`);
            });
        });
        done(err);
    });
}

module.exports.delLVL = (msg, lvl_amount, user, guild) => {
    //Update the user lvl
    pool.query('UPDATE "Users" SET reputation = reputation - $1 WHERE user_id = $2 AND guild_id = $3', [lvl_amount, user.id, msg?msg.guild.id:guild.id]);
}


module.exports.addCoin = (msg, coin_amout, user, guild) => {
    //Update the user coin
    pool.query('UPDATE "Users" SET coin = coin + $1 WHERE user_id = $2 AND guild_id = $3', [coin_amout, user.id, msg?msg.guild.id:guild.id]);
}

module.exports.delCoin = (msg, coin_amout, user, guild) => {
    //Update the user coin
    pool.query('UPDATE "Users" SET coin = coin - $1 WHERE user_id = $2 AND guild_id = $3', [coin_amout, user.id, msg?msg.guild.id:guild.id]);
}

//==================================================//
//                 Inventory Table                  //
//==================================================//

module.exports.addItem = (msg, item_id, user) => {
    //Add Item to a user
    pool.query('INSERT INTO "Inventory" (user_id,item_id,used) VALUES ((SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2),$3,false)', [user.id, msg.guild.id, item_id]);
}

//==================================================//
//                    Shop Table                    //
//==================================================//

module.exports.editShop = (msg, item_id) => {
    //Add Item to a user
    pool.query('UPDATE "Shop" SET quantity = quantity - 1 WHERE guild_id = $1 AND item_id = $2', [msg.guild.id, item_id]);
}

//==================================================//
//                   Invite Table                   //
//==================================================//

module.exports.addInviteScore = async (guild, user) => {
    //1 point when the user join
    //1 point when the user accept the rules for the first time (when the profile is created)
    //1 point when the user reach the level 10
    let results = await pool.query('UPDATE "Users" SET invite_score = invite_score + 1 WHERE user_id = $1 AND guild_id = $2 RETURNING *', [user.id, guild.id]);
    this.addXP(null, 50, user, guild);
    logger(`$c{magenta:${user.username}}} increase his invitation score.`);
    if(Number.isInteger((results.rows[0].invite_score)/10)) {
        let reward = (results.rows[0].invite_score)*100;
        this.addXP(null, reward, user, guild);
        this.addCoin(null, reward, user, guild);
        let result = await pool.query('SELECT base_channel FROM "Guilds" WHERE guild_id = $1', [guild.id]);
        bot.channels.get(result.rows[0].base_channel).send(`Bravo <@${user.id}>, tu as invité ${results.rows[0].invite_score} réfugiés, tu reçois ${reward} points d'expérience et ${reward} trombones.`)
    }
}


//==================================================//
//                    Clan Table                    //
//==================================================//

module.exports.createClan = (msg, user, name) => {
    //Create a clan and add the leader
    msg.guild.createRole({name: name}).then(r => {
        msg.guild.members.get(msg.author.id).addRole(r);
        pool.query('INSERT INTO "Clans" (name,mode,places,role_id) VALUES ($1,$2,$3,$4) RETURNING *', [name, 0, 5, r.id]).then(result => {
            pool.query('INSERT INTO "ClanUser" (user_id,clan_id,rank) VALUES ((SELECT id FROM "Users" WHERE user_id = $1 AND guild_id = $2),$3,\'leader\')',
                [msg.author.id, msg.guild.id, result.rows[0].id]);
        });
    }).catch(msg.reply('Missing Permission'));
}