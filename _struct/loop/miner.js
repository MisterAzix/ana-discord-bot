const pool = require('../database.js');
const logger = require('../logger.js');

const boost_query = `
WITH gen AS (
    SELECT id
    FROM "generator"
    WHERE boost_status = true
    ), boost_value AS (
        SELECT value, generator_id
        FROM "GeneratorComponent", gen
        WHERE generator_id = gen.id
          AND type = 'boost'
    ), update_gen AS (
        UPDATE "generator"
            SET boost_status =
                CASE WHEN status = false OR boost_value.value < date_part('epoch',CURRENT_TIMESTAMP at time zone 'Europe/Paris')::int THEN false
                    ELSE true
                    END
            FROM boost_value
            WHERE id = boost_value.generator_id
            RETURNING boost_status,id
)
UPDATE "GeneratorComponent"
SET value =
    CASE WHEN update_gen.boost_status = false THEN date_part('epoch',CURRENT_TIMESTAMP at time zone 'Europe/Paris')::int+86400
        ELSE value
        END
FROM update_gen
WHERE generator_id = update_gen.id AND type = 'boost'
RETURNING generator_id,level,boost_status
`

const gen_query = `
WITH gen AS ( --SELECT BATTERY
    SELECT id, boost_status
    FROM "generator"
    WHERE status = true
    ), battery_data AS ( --UPDATE BATTERY
        UPDATE "GeneratorComponent" AS battery
            SET value =
                CASE WHEN value-(6-level) < 0 THEN 0
                    ELSE value-(6-level)
                    END FROM gen
            WHERE battery.generator_id = gen.id AND type = 'battery'
            RETURNING gen.id,battery.level,battery.value
    ), cooler_data AS ( --UPDATE TEMPERATURE
        UPDATE "GeneratorComponent" AS cooler
            SET value = floor(random() * 10 + (15+15*battery_data.level)*(1-(5*cooler.level)/100::numeric))
            FROM battery_data
            WHERE cooler.generator_id = battery_data.id
                      AND type = 'cooler'
            RETURNING battery_data.id,cooler.value
    ), boost_data AS (
        SELECT generator_id,level
        FROM "GeneratorComponent", gen
        WHERE type = 'boost'
          AND generator_id = gen.id
          --AND gen.boost_status = true
    ), storage_data AS (
        UPDATE "GeneratorComponent" AS storage
            SET value =
                CASE WHEN floor(storage.value+(50+50*(50-cooler_data.value)/100*1.5)*(1+boost_data.level*5/100)) > storage.level*1000 THEN storage.level*1000
                    ELSE floor(storage.value+(50+50*(50-cooler_data.value)/100*1.5)*(1+boost_data.level*5/100))
                    END
            FROM cooler_data,boost_data
            WHERE storage.generator_id = cooler_data.id
                      AND type = 'storage'
            RETURNING storage.value, storage.level, cooler_data.id
    ), update_gen AS (
    UPDATE "generator"
        SET status =
            CASE WHEN storage_data.value >=  storage_data.level*1000 THEN false
                WHEN battery_data.value <= 0 THEN false
                ELSE true
                END
        FROM storage_data, battery_data
        WHERE "generator".id = battery_data.id
        RETURNING "generator".id
)
SELECT * FROM storage_data;
`


/*const gen_query = `
WITH gen AS (
    SELECT id, boost_status
    FROM "generator"
    WHERE status = true
    ), battery_data AS (
        UPDATE "GeneratorComponent" AS battery
            SET value =
                CASE WHEN value-(6-level) < 0 THEN 0
                    ELSE value-(6-level)
                    END FROM gen
            WHERE battery.generator_id = gen.id AND type = 'battery'
            RETURNING battery.generator_id,battery.level,battery.value
    ), cooler_data AS (
        UPDATE "GeneratorComponent" AS cooler
            SET value = floor(random() * 10 + (15+15*battery_data.level)*(1-5*cooler.level/100))
            FROM battery_data
            WHERE cooler.generator_id = battery_data.generator_id
                      AND type = 'cooler'
            RETURNING cooler.generator_id,cooler.value
    ), boost_data AS (
        SELECT generator_id,level
        FROM "GeneratorComponent", gen
        WHERE type = 'boost'
          AND generator_id = gen.id
          AND gen.boost_status = true
    ), storage_data AS (
        UPDATE "GeneratorComponent" AS storage
            SET value =
                CASE WHEN floor(storage.value+(50+50*(50-cooler_data.value)/100*1.5)*(1-boost_data.level*5/100)) > storage.level*1000 THEN storage.level*1000
                    ELSE floor(storage.value+(50+50*(50-cooler_data.value)/100*1.5)*(1-boost_data.level*5/100))
                    END
            FROM cooler_data,boost_data
            WHERE storage.generator_id = cooler_data.generator_id
                      AND type = 'storage'
            RETURNING storage.value, storage.level, storage.generator_id
)
UPDATE "generator"
SET status =
    CASE WHEN storage_data.value >=  storage_data.level*1000 THEN false
        WHEN battery_data.value <= 0 THEN false
        ELSE true
        END
FROM storage_data, battery_data
WHERE id = storage_data.generator_id
RETURNING storage_data.value;
`*/

module.exports.run = () => {
	pool.query(boost_query).then(() => {
		pool.query(gen_query).then(result => {
            if(result.rowCount > 0) logger(`Miner generation for ${result.rowCount} generator in all guild`);
		});
	});
}