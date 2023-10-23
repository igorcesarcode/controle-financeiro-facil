import { useState, useEffect } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Button,
} from "react-native";
import Constants from "expo-constants";
import * as SQLite from "expo-sqlite";

function openDatabase() {
  if (Platform.OS === "web") {
    return {
      transaction: () => {
        return {
          executeSql: () => {},
        };
      },
    };
  }

  const db = SQLite.openDatabase("db.db");
  return db;
}

const db = openDatabase();

function Items({ done: doneHeading, onPressItem })  { const [items, setItems] = useState(null);

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        `select * from despesas where done = ?;`,
        [doneHeading ? 1 : 0],
        (_, { rows: { _array } }) => setItems(_array)
      );
    });
  }, []);

  const heading = doneHeading ? "Completed" : "Despesas";

  if (items === null || items.length === 0) {
    return null;
  }

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionHeading}>{heading}</Text>
      {items.map(({ id, done, value, data, valor }) => (
        <TouchableOpacity
          key={id}
          onPress={() => onPressItem && onPressItem(id)}
          style={{
            backgroundColor: done ? "#1c9963" : "#fff",
            borderColor: "#000",
            borderWidth: 1,
            padding: 8,
          }}
        >
          <View style={styles.flexRow}>
            <Text style={{ color: done ? "#fff" : "#000" }}>{data} | </Text> 
            <Text style={{ color: done ? "#fff" : "#000" }}>{valor} | </Text> 
            <Text style={{ color: done ? "#fff" : "#000" }}>{value} </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function App() {
  const [text, setText] = useState(null);
  const [valor, setValor] = useState(null);

  const [forceUpdate, forceUpdateId] = useForceUpdate();

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        "create table if not exists despesas (id integer primary key not null, done int, value text, valor integer);"
      );
      tx.executeSql(
        "alter table despesas add column data date;"
      );
    });
  }, []);

  const add = (text, valor) => {
    // is valor empty?
    console.log(text)
    console.log(valor)
    if (valor === null || valor === "") {
      return false;
    }
    console.log("linha 93")

    db.transaction(
      (tx) => {
        tx.executeSql("insert into despesas (done, value, valor, data) values (0, ?, ?, CURRENT_TIMESTAMP)", [text, valor]);
        tx.executeSql("select * from despesas", [], (_, { rows }) =>
          console.log(JSON.stringify(rows))
        );
      },
      (e) => {console.log(e)},
      forceUpdate
    );

    console.log("linha 106")

  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Controle Financeiro Fácil</Text>

      {Platform.OS === "web" ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={styles.heading}>
            Expo SQlite is not supported on web!
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.flexRow}>
            <TextInput
              onChangeText={(valor) => setValor(valor)}
              placeholder="Valor (R$)"
              style={styles.input}
              value={text}
              keyboardType="numeric"
            />
            <TextInput
              onChangeText={(text) => setText(text)}
              placeholder="Descrição"
              style={styles.input}
              value={text}
            />
            
            <Button
              title="OK"
              onPress={() => {
                add(text, valor);
                setValor(null);
                setText(null);
              }}
            />
          </View>
          <ScrollView style={styles.listArea}>
            <Items
              key={`forceupdate-todo-${forceUpdateId}`}
              done={false}
            />
          </ScrollView>
        </>
      )}
    </View>
  );
}

function useForceUpdate() {
  const [value, setValue] = useState(0);
  return [() => setValue(value + 1), value];
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    flex: 1,
    paddingTop: Constants.statusBarHeight,
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  flexRow: {
    flexDirection: "row",
  },
  input: {
    borderColor: "#4630eb",
    borderRadius: 4,
    borderWidth: 1,
    flex: 1,
    height: 48,
    margin: 16,
    padding: 8,
  },
  listArea: {
    backgroundColor: "#f0f0f0",
    flex: 1,
    paddingTop: 16,
  },
  sectionContainer: {
    marginBottom: 16,
    marginHorizontal: 16,
  },
  sectionHeading: {
    fontSize: 18,
    marginBottom: 8,
  },
});
